## 2026-06-24T10:41:33Z

You are teamwork_preview_worker.
Your working directory is /home/nirmal/Development/Bifrost/.agents/worker_m3_2.
Your task is to implement the fixes for the QR Scanner leaks and crash hazards in `ScannerScreen.kt` and `MainScreen.kt`, compile the app, and verify that the app compiles and runs successfully.

Here are the details of the bugs and fixes:
1. **Executor and Camera Leaks in `ScannerScreen.kt`**:
   - Add a `DisposableEffect` that unbinds the camera provider and shuts down the executor when `ScannerScreen` is disposed.
   - Use `remember` to cache a single-thread executor instead of instantiating `Executors.newSingleThreadExecutor()` inside the analyzer registration.
2. **CameraX Initialization Crash**:
   - Wrap `cameraProviderFuture.get()` and subsequent CameraX configuration inside the listener's `try-catch` block.
3. **NPE/Crash on Malformed QR Code and Cancel Action**:
   - Update `ScannerScreen` signature to take `onCancelScan: () -> Unit`.
   - Add Compose `BackHandler` inside `ScannerScreen` to trigger `onCancelScan()` if the back button is pressed.
   - If permission is denied in the activity result launcher, call `onCancelScan()`.
   - In `MainScreen.kt`, check that `parsed.ip` is not null or empty and `parsed.token` is not null or empty before setting the `config` state and calling `startConnectionService`. Display a Toast on invalid QR data.
   - Pass `onCancelScan = { isScanning = false }` to `ScannerScreen`.

Please edit `/home/nirmal/Development/Bifrost/companion-app/app/src/main/java/com/example/bifrostcompanion/ScannerScreen.kt` and `/home/nirmal/Development/Bifrost/companion-app/app/src/main/java/com/example/bifrostcompanion/MainScreen.kt` to apply these fixes.
After making the edits, build the debug APK using `./gradlew assembleDebug` in `/home/nirmal/Development/Bifrost/companion-app/` and run the tests to verify the project builds cleanly.

Handoff details:
- Write your handoff.md detailing the files you modified, the exact changes you made, the build command output, and the APK details.
- Send a message to your parent conversation ID (b34d5257-5aa3-4f97-9f2e-67f8bcf219fc) with the path to your handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
