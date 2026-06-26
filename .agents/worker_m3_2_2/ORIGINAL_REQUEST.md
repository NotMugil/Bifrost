## 2026-06-24T10:46:23Z
Your working directory is /home/nirmal/Development/Bifrost/.agents/worker_m3_2_2.
Your task is to fix the critical bugs and resource leaks identified during code review of the QR Scanner in `ScannerScreen.kt` and `MainScreen.kt`.

Please apply the following changes:
1. **Fix Camera Leak on Early Exit**:
   - In `ScannerScreen.kt`, keep track of whether the screen is active using a boolean flag (e.g. `var isScreenActive by remember { mutableStateOf(true) }`).
   - In the `DisposableEffect(Unit)` or similar dispose handler, set `isScreenActive = false`.
   - Inside the `cameraProviderFuture.addListener` listener callback, check `if (!isScreenActive) return@addListener` before calling `bindToLifecycle` to avoid launching the camera in the background if the user has already navigated away.
2. **Fix `cameraExecutor` Lifecycle Keying**:
   - Tie the lifecycle of `cameraExecutor` to the composition directly by keying `DisposableEffect(cameraExecutor)` or `DisposableEffect(Unit)` instead of `DisposableEffect(lifecycleOwner)`. This prevents the executor from being shut down and left inactive if `lifecycleOwner` changes.
3. **Fix Thread-Safety on Scan State**:
   - Instead of reading/writing Compose `MutableState<Boolean>` inside the background analyzer thread, use `val isScanned = remember { java.util.concurrent.atomic.AtomicBoolean(false) }`.
   - Update the analyzer to read/set this atomic boolean thread-safely.
4. **Fix Native Resource Leak (ML Kit `BarcodeScanner`)**:
   - Cache/remember the `BarcodeScanner` instance (or declare it in a way that allows cleanup), and close it using `scanner.close()` inside the `onDispose` block of `DisposableEffect`.
5. **Fix Port Validation**:
   - In `MainScreen.kt`, extend the QR configuration validation check to ensure that the port is valid (e.g., `parsed.port in 1..65535` or `parsed.port > 0`).

Please edit `/home/nirmal/Development/Bifrost/companion-app/app/src/main/java/com/example/bifrostcompanion/ScannerScreen.kt` and `/home/nirmal/Development/Bifrost/companion-app/app/src/main/java/com/example/bifrostcompanion/MainScreen.kt` to apply these fixes.
After making the edits, build the debug APK using `./gradlew assembleDebug` in `/home/nirmal/Development/Bifrost/companion-app/` and run the tests (`./gradlew test`) to verify the project builds cleanly.

Handoff details:
- Write your handoff.md detailing the files you modified, the exact changes you made, the build command output, and the APK details.
- Send a message to your parent conversation ID (b34d5257-5aa3-4f97-9f2e-67f8bcf219fc) with the path to your handoff.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
