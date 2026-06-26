# Analysis - QR Scanner & Permissions in Companion App

## Overview
This report documents the investigation of the QR Scanner functionality, runtime permissions, potential resource leaks, and crash vulnerabilities in the `companion-app` of Bifrost.

---

## 1. Source Code Examination
The QR Scanning functionality is implemented using **Jetpack Compose**, **CameraX**, and **Google ML Kit Barcode Scanning**.

### MainActivity.kt
- Location: `companion-app/app/src/main/java/com/example/bifrostcompanion/MainActivity.kt`
- Purpose: Entry point of the companion application. It calls `enableEdgeToEdge()` and sets the content view to `MainNavigation()`.

### MainScreen.kt
- Location: `companion-app/app/src/main/java/com/example/bifrostcompanion/MainScreen.kt`
- Purpose: Handles high-level navigation, tab switching (Home, Remote PC), permission launcher definitions, and starting/stopping the connection service.
- **Key Code Elements**:
  - `MainNavigation()` manages state for `isScanning` (whether the scanner overlay is active), `config` (connection credentials), and the bottom tabs.
  - `cameraPermissionLauncher` handles requesting camera permissions:
    ```kotlin
    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) { onStartScan() }
    }
    ```
  - When the "Scan QR Code to Connect" button is clicked:
    ```kotlin
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
        onStartScan()
    } else {
        cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
    }
    ```

### ScannerScreen.kt
- Location: `companion-app/app/src/main/java/com/example/bifrostcompanion/ScannerScreen.kt`
- Purpose: Displays the camera preview overlay using a CameraX `PreviewView` embedded in a Compose `AndroidView`, processes video frames with ML Kit's `BarcodeScanning` client, and fires `onCodeScanned` when a QR code is detected.
- **Key Code Elements**:
  - Sets up CameraX `ImageAnalysis` analyzer to process frames:
    ```kotlin
    imageAnalysis.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy -> ... }
    ```
  - Analyzes frames with `scanner.process(image)`.
  - Attempts to bind CameraX lifecycle to `LocalLifecycleOwner.current`.

### AndroidManifest.xml
- Location: `companion-app/app/src/main/AndroidManifest.xml`
- Purpose: Declares permissions and services.
- **Permissions and Features Declared**:
  - `<uses-feature android:name="android.hardware.camera" android:required="false" />`
  - `<uses-permission android:name="android.permission.CAMERA" />`
  - `<uses-permission android:name="android.permission.INTERNET" />`
  - `<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />`
  - `<uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />`
  - `<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />`
  - `<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />`
  - `<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />`

---

## 2. Runtime Permissions
The app manages multiple categories of permissions/access:
1. **Camera Permission (`android.permission.CAMERA`)**:
   - Declared in the manifest and checked before entering `ScannerScreen`.
   - If missing, requested at runtime via Compose Activity Result APIs.
2. **Notification Permission (`android.permission.POST_NOTIFICATIONS`)**:
   - Requested on Android 13+ (API 33+) inside `LaunchedEffect(Unit)` on main screen mount.
3. **Notification Listener Access**:
   - Required to sync notifications.
   - Requires redirecting the user to `Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`.
4. **All Files Storage Access (`android.permission.MANAGE_EXTERNAL_STORAGE`)**:
   - Checked using `Environment.isExternalStorageManager()` on Android 11+ (API 30+).
   - If missing, redirects user to `Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION`.

---

## 3. Potential Bugs, Resource Leaks, and Crash Risks

### A. Camera Resource Leak (Critical Battery/Hardware Leak)
- **Problem**: In `ScannerScreen.kt`, the `ProcessCameraProvider` is bound to the lifecycle of the activity (`LocalLifecycleOwner.current` resolves to the hosting activity). However, when the Composable is disposed (i.e., `isScanning` is set to `false` and the scanner is removed from the UI tree), there is no cleanup mechanism. The camera remains active and bound to the background activity.
- **Consequence**: High power usage, device heating, battery drain, and locking of the camera hardware (preventing other apps from using it).
- **Fix**: Implement a `DisposableEffect` that unbinds the camera when the Composable is disposed:
  ```kotlin
  DisposableEffect(lifecycleOwner) {
      onDispose {
          try {
              if (cameraProviderFuture.isDone) {
                  cameraProviderFuture.get().unbindAll()
              }
          } catch (e: Exception) {
              e.printStackTrace()
          }
      }
  }
  ```

### B. Executor Thread Leak (Resource Leak)
- **Problem**: In `ScannerScreen.kt` (line 79), `imageAnalysis.setAnalyzer` is configured with `Executors.newSingleThreadExecutor()`. This creates a new thread pool executor on every binding, but `shutdown()` is never called.
- **Consequence**: A thread is leaked each time `ScannerScreen` is created and bound, causing progressive thread accumulation.
- **Fix**: Remember the executor and shut it down when disposed:
  ```kotlin
  val analyzerExecutor = remember { Executors.newSingleThreadExecutor() }
  DisposableEffect(Unit) {
      onDispose {
          analyzerExecutor.shutdown()
      }
  }
  ```

### C. Uncaught Exception in Camera Provider Future (Crash Risk)
- **Problem**: At line 64 in `ScannerScreen.kt`, `cameraProviderFuture.get()` is invoked outside the `try-catch` block:
  ```kotlin
  cameraProviderFuture.addListener({
      val cameraProvider = cameraProviderFuture.get()
      ...
  ```
- **Consequence**: If CameraX initialization fails (common on emulators without camera emulation or devices with broken camera hardware), `get()` throws an `ExecutionException`, causing the app to crash immediately.
- **Fix**: Move the `cameraProviderFuture.get()` call inside the `try` block:
  ```kotlin
  cameraProviderFuture.addListener({
      try {
          val cameraProvider = cameraProviderFuture.get()
          val preview = Preview.Builder().build().also {
              it.setSurfaceProvider(previewView.surfaceProvider)
          }
          ...
      } catch (e: Exception) {
          e.printStackTrace()
      }
  }, executor)
  ```

### D. NullPointerException on Malformed QR Code (Crash Risk)
- **Problem**: In `MainScreen.kt`, when a code is scanned, Gson deserializes the text into a `ConnectionConfig`:
  ```kotlin
  val parsed = Gson().fromJson(qrResult, ConnectionConfig::class.java)
  config = parsed
  ```
  Gson uses unsafe reflection to instantiate Kotlin classes. If a user scans a QR code containing valid JSON but lacking the `ip` or `token` keys (e.g. `{}`), Gson sets the fields to `null` even though they are declared non-nullable (`val ip: String`). When `MainScreen` is recomposed, it tries to evaluate:
  ```kotlin
  Text("Connected to: ${config.ip}:${config.port}")
  ```
- **Consequence**: Accessing the non-nullable `ip` property throws a `NullPointerException` at runtime, causing a crash.
- **Fix**: Validate that `parsed.ip` and `parsed.token` are not null/empty before assigning it to the state variable:
  ```kotlin
  val parsed = Gson().fromJson(qrResult, ConnectionConfig::class.java)
  if (parsed != null && !parsed.ip.isNullOrEmpty() && !parsed.token.isNullOrEmpty()) {
      config = parsed
      startConnectionService(context, parsed)
  } else {
      // Toast / UI feedback for invalid configuration
  }
  ```

### E. Stuck Blank UI on Permission Denial & Lack of BackHandler
- **Problem**: `ScannerScreen` handles permissions internally, but if permission is denied, it returns early:
  ```kotlin
  if (!hasCameraPermission) {
      return // Wait for permission
  }
  ```
  This renders a blank screen. Crucially, there is no back button handler or close button in `ScannerScreen` or `MainNavigation` to set `isScanning = false`.
- **Consequence**: If a user enters this screen and denies the permission, they are stuck on a blank screen with no way to return to the home screen.
- **Fix**: Add a Compose `BackHandler` inside `ScannerScreen` to reset the scan state:
  ```kotlin
  import androidx.activity.compose.BackHandler
  
  BackHandler {
      // Call parent callback to cancel scanning
      onCancelScan()
  }
  ```

---

## 4. Patches and Scripts
We examined the following two scripts in the `companion-app` directory:

1. **`patch_main_screen.py`**:
   - **Purpose**: Modifies `MainScreen.kt` to introduce `MainNavigation` which adds bottom tab navigation with two tabs: "Home" (displaying `MainScreen`) and "Remote PC" (displaying `RemotePCScreen`). It also handles switching to `ScannerScreen` when scanning is active.
   - **Status**: Already applied. The structure of `MainScreen.kt` matches the script's output exactly.

2. **`patch_connection_service.py`**:
   - **Purpose**: Patches `ConnectionService.kt` to support remote screen control and file writing features. Specifically:
     - Adds `videoFrameFlow` (StateFlow of Bitmap) in the companion object.
     - Adds a helper method `sendMessage(message: String)`.
     - In the WebSocket message handler, adds support for `"write_file"` (writes incoming base64 file data to the filesystem) and `"video_frame"` (decodes base64-encoded screenshots into a Bitmap and posts them to `videoFrameFlow`).
   - **Status**: Already applied. These components are fully present in `ConnectionService.kt`.

---

## 5. Verification & Implementation Strategy

### Proposed Fixes

#### 1. In `ScannerScreen.kt`:
Update the `ScannerScreen` Composable signature to take a callback for cancellation (e.g., `onCancelScan: () -> Unit`), add a `BackHandler` to trigger it, move CameraX setup inside the `try` block, and handle resource cleanup.

```kotlin
@Composable
fun ScannerScreen(
    onCodeScanned: (String) -> Unit,
    onCancelScan: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    var isScanned by remember { mutableStateOf(false) }

    // Register BackHandler to allow exiting Scanner Screen
    androidx.activity.compose.BackHandler {
        onCancelScan()
    }

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        hasCameraPermission = isGranted
        if (!isGranted) {
            onCancelScan() // Exit scanner if permission is denied
        }
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    // Allocate analyzer executor
    val analyzerExecutor = remember { Executors.newSingleThreadExecutor() }

    // Clean up resources on disposal
    DisposableEffect(lifecycleOwner) {
        onDispose {
            analyzerExecutor.shutdown()
            try {
                if (cameraProviderFuture.isDone) {
                    cameraProviderFuture.get().unbindAll()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    if (!hasCameraPermission) {
        return // Wait for permission or exit
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            val previewView = PreviewView(ctx)
            val executor = ContextCompat.getMainExecutor(ctx)

            cameraProviderFuture.addListener({
                try {
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().also {
                        it.setSurfaceProvider(previewView.surfaceProvider)
                    }

                    val imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build()

                    val options = BarcodeScannerOptions.Builder()
                        .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                        .build()
                    val scanner = BarcodeScanning.getClient(options)

                    imageAnalysis.setAnalyzer(analyzerExecutor) { imageProxy ->
                        if (isScanned) {
                            imageProxy.close()
                            return@setAnalyzer
                        }
                        
                        @androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
                        val mediaImage = imageProxy.image
                        if (mediaImage != null) {
                            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                            scanner.process(image)
                                .addOnSuccessListener { barcodes ->
                                    for (barcode in barcodes) {
                                        val rawValue = barcode.rawValue
                                        if (rawValue != null && !isScanned) {
                                            isScanned = true
                                            executor.execute {
                                                onCodeScanned(rawValue)
                                            }
                                        }
                                    }
                                }
                                .addOnCompleteListener {
                                    imageProxy.close()
                                }
                        } else {
                            imageProxy.close()
                        }
                    }

                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        CameraSelector.DEFAULT_BACK_CAMERA,
                        preview,
                        imageAnalysis
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }, executor)

            previewView
        }
    )
}
```

#### 2. In `MainScreen.kt` (`MainNavigation`):
Ensure we pass `onCancelScan = { isScanning = false }` and validate the JSON properties before updating the config state.

```kotlin
    if (isScanning) {
        ScannerScreen(
            onCodeScanned = { qrResult ->
                isScanning = false
                try {
                    val parsed = Gson().fromJson(qrResult, ConnectionConfig::class.java)
                    if (parsed != null && !parsed.ip.isNullOrEmpty() && !parsed.token.isNullOrEmpty()) {
                        config = parsed
                        startConnectionService(context, parsed)
                    } else {
                        android.widget.Toast.makeText(context, "Invalid QR Code Configuration", android.widget.Toast.LENGTH_LONG).show()
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    android.widget.Toast.makeText(context, "Failed to parse QR Code", android.widget.Toast.LENGTH_LONG).show()
                }
            },
            onCancelScan = {
                isScanning = false
            }
        )
    }
```

### Verification Plan

#### Manual Verification
1. **Build and Run**: Build and deploy the APK to a real test device or emulator.
   ```bash
   ./gradlew assembleDebug
   ```
2. **Camera Permitting UI flow**:
   - Revoke camera permission: `adb shell pm revoke com.example.bifrostcompanion android.permission.CAMERA`
   - Open app and click "Scan QR Code to Connect". Verify runtime permission pop-up appears.
   - Deny permission: Verify the app remains on the Home tab and does not crash or get stuck on a blank screen.
   - Grant permission: Verify scanner view launches correctly.
3. **Scan Testing**:
   - Generate a valid connection QR code matching: `{"ip":"192.168.1.100","port":8080,"token":"secret"}`. Scan it and verify that `ConnectionService` is successfully launched and the home page updates to display "Connected to: 192.168.1.100:8080".
   - Generate an invalid/malformed QR code (e.g., `{"port": 8080}` or unrelated text). Scan it and verify that it displays a Toast message indicating failure, and does not crash the app.
4. **Lifecycle & Hardware release**:
   - Open scanner screen, verify camera is active.
   - Press system back button or scan a code to return to home.
   - Verify that the camera hardware turns off (LED indicator on physical device disappears, battery usage ceases, and background threads of camera are released).

#### Automated Verification
- Write a local JUnit instrumented test in `app/src/androidTest/java/com/example/bifrostcompanion/` to assert that:
  - Scanned codes with missing fields are handled gracefully without NPEs.
  - A mock Activity contract returns true/false for permission checks, and the navigation matches expectations.
