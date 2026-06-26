# QR Scanner Codebase Investigation Report

## 1. QR Scanning Implementation Analysis
The companion-app uses **CameraX** and **Google ML Kit Barcode Scanning** to scan QR codes.

### Key Files:
- **`MainActivity.kt`**: The entry point of the companion application. It enables edge-to-edge UI and hosts the `MainNavigation()` composable in `MainScreen.kt`.
- **`MainScreen.kt`**:
  - Handles general app states (e.g. connection configurations, permissions status for Notifications and Storage).
  - Contains `MainNavigation()`, which acts as the router. If `isScanning` is true, it displays `ScannerScreen`. Otherwise, it displays a `Scaffold` containing the bottom navigation bar ("Home" and "Remote PC" tabs) and the respective screen content.
  - Triggers permission launcher for `Manifest.permission.CAMERA` if the camera permission is not yet granted when clicking the "Scan QR Code to Connect" button.
- **`ScannerScreen.kt`**:
  - Sets up the CameraX lifecycle binding, `PreviewView` layout, and an `ImageAnalysis` analyzer.
  - Integrates `BarcodeScanning.getClient(options)` with `Barcode.FORMAT_QR_CODE` configuration.
  - Once a QR code is detected, it triggers `onCodeScanned(rawValue)` and passes the string back to `MainNavigation` in `MainScreen.kt`.
- **`AndroidManifest.xml`**:
  - Declares `<uses-permission android:name="android.permission.CAMERA" />`.
  - Declares `<uses-feature android:name="android.hardware.camera" android:required="false" />`, allowing the app to be installed on devices without cameras.

---

## 2. Runtime Camera Permission Handling
- **Request Flow**:
  1. The user clicks "Scan QR Code to Connect" in `MainScreen.kt`.
  2. If `Manifest.permission.CAMERA` is granted, `onStartScan()` is called, setting `isScanning = true`.
  3. If not granted, the `cameraPermissionLauncher` is launched. On acceptance, it calls `onStartScan()`.
  4. Once `isScanning` is true, `ScannerScreen` is composed.
  5. Inside `ScannerScreen.kt`, a duplicate check is performed. If `hasCameraPermission` is false, it launches `permissionLauncher.launch(Manifest.permission.CAMERA)` inside a `LaunchedEffect(Unit)`.
  6. If `hasCameraPermission` is still false, it returns early (`return`), displaying a blank screen.

---

## 3. Potential Bugs, Crashes, and Usability Issues
1. **Camera Provider Future Crash**:
   - In `ScannerScreen.kt` line 64:
     ```kotlin
     val cameraProvider = cameraProviderFuture.get()
     ```
     This call is performed inside a `ListenableFuture.addListener` callback running on the Main Thread executor. If camera provider initialization fails (common on misconfigured Android Emulators or due to camera daemon issues), `cameraProviderFuture.get()` will throw an `ExecutionException` or `InterruptedException`.
     Since there is no `try-catch` enclosing this block, the exception will crash the application immediately.
2. **Denial Soft-Lock (Blank Screen UX Bug)**:
   - In `ScannerScreen.kt`, if the user denies camera permission, `hasCameraPermission` remains false.
   - The composable returns early: `if (!hasCameraPermission) { return }`.
   - This results in a completely blank screen because `isScanning` is still `true` in `MainScreen.kt`, and there is no UI, close button, or gesture to exit the scan mode or reset `isScanning = false`. The user is stuck on a blank screen.
3. **Hardcoded Back Camera Support**:
   - `ScannerScreen.kt` binds the lifecycle using `CameraSelector.DEFAULT_BACK_CAMERA`.
   - On devices or emulators that only have a front-facing camera, `bindToLifecycle` will throw an exception. Although this is caught inside a `try-catch`, the preview screen will remain black with no fallback or user-friendly error message.

---

## 4. Companion-App Patches Analysis
There are two Python scripts in the `companion-app` folder:
1. **`patch_connection_service.py`**:
   - **Purpose**: Modifies `ConnectionService.kt` to support remote screen streaming.
     - Adds `videoFrameFlow` (a `MutableStateFlow<Bitmap?>`) in `ConnectionService`'s companion object.
     - Patches the `onMessage` handler to decode base64 video frames from `"video_frame"` messages, convert them to `Bitmap`, and publish them to `videoFrameFlow`.
   - **Status**: **Already Applied**. The code in `ConnectionService.kt` matches the patched version.
2. **`patch_main_screen.py`**:
   - **Purpose**: Modifies `MainScreen.kt` to introduce tabbed navigation.
     - Replaces `MainNavigation()` with a version containing a bottom navigation bar ("Home" and "Remote PC" tabs).
     - Wire up the "Remote PC" tab to display `RemotePCScreen()` and utilize the `videoFrameFlow` from `ConnectionService`.
   - **Status**: **Already Applied**. The code in `MainScreen.kt` matches the patched version.

---

## 5. Verification and Implementation Strategy
To resolve these issues, the implementer/worker should follow this strategy:

### Proposed Code Fixes:
1. **Add Try-Catch around `cameraProviderFuture.get()`**:
   - Wrap the call in a `try-catch` block to handle exceptions and show a fallback message or log it cleanly.
2. **Add a Dismiss/Close Button and Handle Denial Gracefully**:
   - Pass an `onClose: () -> Unit` callback from `MainNavigation` to `ScannerScreen`.
   - In `ScannerScreen.kt`, if permission is denied, render a friendly UI stating "Camera permission is required to scan QR codes" and provide a "Go Back" button that calls `onClose()`.
   - Overlay a floating close button on top of the camera preview so the user can cancel scanning at any time.

### Verification Steps for the Worker:
- **Build the companion app**: Run `./gradlew assembleDebug` inside the `companion-app` directory.
- **Run the companion app**: Install and run on an Android emulator or device using `./gradlew installDebug`.
- **Verify Permission Scenarios using ADB**:
  - *To test permission denial behavior*:
    1. Revoke camera permission:
       `adb shell pm revoke com.example.bifrostcompanion android.permission.CAMERA`
    2. Launch application:
       `adb shell am start -n com.example.bifrostcompanion/.MainActivity`
    3. Click "Scan QR Code to Connect". Deny the permission when prompted.
    4. Confirm that the app does not crash and that the user can return to the main screen (once the close/dismiss fixes are implemented).
  - *To test permission approval behavior*:
    1. Launch the app and grant the camera permission when prompted.
    2. Confirm that the Camera preview starts up successfully.
- **Simulate Camera Provider Failure**:
  - Run the app on an Android Emulator with "Camera Back" configured to "None" in the AVD settings.
  - Verify that the app handles the error gracefully instead of crashing on `cameraProviderFuture.get()`.
