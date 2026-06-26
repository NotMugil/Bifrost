# Handoff Report — QR Scanner, Runtime Permissions, and Stability Analysis

## 1. Observation

During a read-only review of the `companion-app` codebase, the following files and content were observed:

- **`companion-app/app/src/main/java/com/example/bifrostcompanion/ScannerScreen.kt`**:
  - Line 32: `val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }`
  - Lines 47-51:
    ```kotlin
    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }
    ```
  - Lines 53-55:
    ```kotlin
    if (!hasCameraPermission) {
        return // Wait for permission
    }
    ```
  - Lines 57-124: The `AndroidView` hosts the `PreviewView` and sets up CameraX binding.
  - Line 79: `imageAnalysis.setAnalyzer(Executors.newSingleThreadExecutor()) { imageProxy -> ... }`
  - Lines 90-103:
    ```kotlin
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
    ```
  - Lines 109-119: Camera lifecycle binding is executed within the `AndroidView` factory callback:
    ```kotlin
    try {
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
    ```
  - Note: There are no callbacks or effects handling `onDispose` to release the camera provider or shut down the executor thread.

- **`companion-app/app/src/main/java/com/example/bifrostcompanion/MainScreen.kt`**:
  - Lines 38-48:
    ```kotlin
    if (isScanning) {
        ScannerScreen(onCodeScanned = { qrResult ->
            isScanning = false
            try {
                val parsed = Gson().fromJson(qrResult, ConnectionConfig::class.java)
                config = parsed
                startConnectionService(context, parsed)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        })
    }
    ```

- **Patch Scripts**:
  - `companion-app/patch_connection_service.py` is present and was applied, modifying `ConnectionService.kt` to include `videoFrameFlow` state flow and handle `"video_frame"` base64 data payloads.
  - `companion-app/patch_main_screen.py` is present and was applied, modifying `MainScreen.kt` to support tabbed navigation between "Home" and "Remote PC", and setting up `isScanning` states.

---

## 2. Logic Chain

1. **Camera Leak (Battery & Resource drain)**:
   - *Premise 1*: CameraX binds the camera stream to `lifecycleOwner` (which is `MainActivity`).
   - *Premise 2*: `MainActivity` remains active/resumed while the user interacts with the app after the scanner screen closes (`isScanning = false`).
   - *Premise 3*: `ScannerScreen.kt` does not call `cameraProvider.unbindAll()` on disposal (when it leaves the composition).
   - *Conclusion*: The camera remains active and hardware resources stay locked in the background even after `ScannerScreen` is closed.

2. **Thread Executor Leak**:
   - *Premise 1*: `imageAnalysis.setAnalyzer` is instantiated with a new `Executors.newSingleThreadExecutor()` every time the `AndroidView` factory is run.
   - *Premise 2*: There is no reference saved to this executor to call `.shutdown()`, nor is it handled in an `onDispose` block.
   - *Conclusion*: A new thread is leaked each time `ScannerScreen` is opened and closed, which eventually triggers process-level thread exhaustion or Out Of Memory (OOM) crashes.

3. **Blank Screen UI Hang**:
   - *Premise 1*: If permission is denied, `hasCameraPermission` is false, and the composable returns early (`return`), rendering no Compose elements.
   - *Premise 2*: There is no visual close or retry button when `hasCameraPermission` is false.
   - *Premise 3*: No `BackHandler` is registered to change `isScanning` back to false when the system back button is pressed.
   - *Conclusion*: On permission denial, the app hangs indefinitely on a blank/black screen with no way to return to the home screen other than minimizing the activity.

4. **Uncaught Exception/Crash Risk**:
   - *Premise 1*: `val cameraProvider = cameraProviderFuture.get()` retrieves the camera provider from the future.
   - *Premise 2*: The call is outside the `try/catch` block.
   - *Conclusion*: Any hardware failure or system-level error retrieving the camera provider will throw an unhandled `ExecutionException` or `InterruptedException`, crashing the app.

---

## 3. Caveats

- **Device Hardware Specifics**: CameraX behaviour can vary on different physical devices (especially older legacy camera hardware). The resource locking behavior was deduced based on the Kotlin source code architecture rather than on-device debugging, but it conforms to standard CameraX API lifecycle specs.
- **Gradle Version**: Compiles with compileSdk 36, meaning it targets Android 14+ behavior. Dynamic permissions under Android 14/15 were considered.

---

## 4. Conclusion

The current QR scanning implementation is operational but highly unstable. It will leak camera hardware streams and background analysis threads, and will hang/freeze if permission is denied. 

To resolve these issues, the implementation must be refactored to:
1. Wrap `ProcessCameraProvider` and the analysis executor in Compose lifecycle hooks (`remember` and `DisposableEffect`) to clean up/unbind/shutdown resources when the scanner is closed.
2. Register a Compose `BackHandler` to allow cancelling the scan.
3. Provide a fallback screen layout (message, grant button, cancel button) if permissions are denied.
4. Wrap future `.get()` calls in a `try-catch` block and display Toast messages for invalid QR syntax.

---

## 5. Verification Method

### Compilation & Installation
1. Compile the companion-app using the Gradle wrapper:
   ```bash
   cd companion-app
   ./gradlew assembleDebug
   ```
2. Install the app on an Android device or emulator with a camera:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### Permission & UI Flow Verification
1. Open the companion-app on a device where camera permission has not yet been granted.
2. Tap the **"Scan QR Code to Connect"** button.
3. Verify that the camera permission dialog appears.
4. Choose **"Deny"**. Verify that the app displays a custom fallback screen with descriptive text, a "Grant Permission" button, and a "Cancel" button.
5. Tap **"Cancel"** or press the system back button. Verify that the app correctly returns to the home screen and does not exit the application.
6. Tap **"Scan QR Code to Connect"** again, tap **"Grant Permission"** (or allow on the prompt), and verify that the camera preview renders.

### Resource Leak Verification
1. Connect the running app to Android Studio's Profiler (CPU and Memory profilers).
2. Repeatedly click **"Scan QR Code to Connect"** and then press the system back button to exit, repeating this 10+ times.
3. Verify in the Profiler that the thread count does not continuously increment (no thread leak).
4. Verify that the device's green camera usage indicator turns off immediately upon exiting the scanner screen (no camera resource leak).

### QR Parse Verification
1. Scan a valid configuration QR code (e.g. `{"ip":"192.168.1.10","port":8080,"token":"secret"}`). Verify that it starts the service and displays connection status.
2. Scan an invalid QR code (e.g., standard website URL `https://google.com`). Verify that the scanner closes and a Toast displaying *"Invalid QR Code format"* is shown.
