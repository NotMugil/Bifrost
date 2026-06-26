# Review Report: Memory Leak, Stability, and Exit Handling Fixes

## Review Summary

**Verdict**: REQUEST_CHANGES

The changes made by the Worker provide a solid foundation, including BackHandler integration, permission denial handling, try-catch blocks for CameraX/Gson, and basic unbinding/executor shutdown. However, there are significant resource leaks and potential crash scenarios under specific conditions that need to be addressed before approval.

---

## Findings

### [Major] Finding 1: Camera Resource Leak in Background
- **What**: The camera remains active and consumes power in the background if `cameraProviderFuture` resolves after the screen is disposed.
- **Where**: `ScannerScreen.kt` (lines 39-50, lines 87-144)
- **Why**: 
  - `onDispose` checks `cameraProviderFuture.isDone` and only unbinds if it is true.
  - If the user opens and quickly exits the screen before the future completes, `isDone` is false, and unbinding is skipped.
  - When the future resolves later, the listener inside the `AndroidView` factory runs. It retrieves the provider and calls `bindToLifecycle` with `lifecycleOwner` (the main Activity), which is still resumed. The camera starts streaming in the background with no UI visible.
- **Suggestion**: Keep track of the screen's active status using a remember/disposable flag (e.g. `var isScreenActive by remember { mutableStateOf(true) }`) and check `if (!isScreenActive) return@addListener` inside the listener callback before performing any camera binding.

### [Major] Finding 2: `cameraExecutor` Shutdown Crash Scenario
- **What**: Recompositions where `lifecycleOwner` changes will cause a crash due to `RejectedExecutionException`.
- **Where**: `ScannerScreen.kt` (lines 37, 39)
- **Why**: 
  - `cameraExecutor` is remembered key-less: `remember { Executors.newSingleThreadExecutor() }`.
  - `DisposableEffect` is keyed on `lifecycleOwner`: `DisposableEffect(lifecycleOwner)`.
  - If `lifecycleOwner` changes, `onDispose` is triggered and shuts down `cameraExecutor`.
  - However, because the executor is not keyed on `lifecycleOwner`, the same shut down executor instance is retained in composition. Any subsequent analysis frame dispatched to it will crash with a `RejectedExecutionException`.
- **Suggestion**: Key the `DisposableEffect` on `cameraExecutor` or use `Unit` to tie its lifecycle directly to the composition rather than `lifecycleOwner`.

### [Minor] Finding 3: Thread-Safety Violation on Compose State
- **What**: Reading/writing Compose `MutableState` from a background thread.
- **Where**: `ScannerScreen.kt` (lines 35, 105, 118-119)
- **Why**: `isScanned` is a Compose state variable, but it is read and modified inside `cameraExecutor`'s analyzer thread. This is not thread-safe and can cause concurrent state modification issues.
- **Suggestion**: Use a thread-safe `AtomicBoolean` or `volatile boolean` (via `remember { AtomicBoolean(false) }`) inside the analyzer, as `isScanned` is not read anywhere in the UI layout.

### [Minor] Finding 4: Missing Port Validation
- **What**: Invalid port value of `0` passes validation.
- **Where**: `MainScreen.kt` (lines 43-50)
- **Why**: If a scanned QR code does not contain a `port` field, Gson deserializes it as `0` by default. The validation condition checks `!parsed.ip.isNullOrEmpty() && !parsed.token.isNullOrEmpty()` but allows port `0`, which leads to an invalid connection service state.
- **Suggestion**: Add a validation check for the port: `parsed.port > 0` (or `parsed.port in 1..65535`).

### [Minor] Finding 5: Unclosed ML Kit `BarcodeScanner`
- **What**: `BarcodeScanner` instance is leaked.
- **Where**: `ScannerScreen.kt` (line 102)
- **Why**: `BarcodeScanner` implements `Closeable` and allocates native resources for the ML Kit model. The created `scanner` is never closed when the composable is disposed.
- **Suggestion**: Store and close the `scanner` instance in `onDispose`.

---

## Verified Claims

- **Memory Leak Fix (Executor Shutdown)** -> verified via inspection -> **PASS** (Shutdown is called on dispose, but has key mismatch issue described in Finding 2)
- **Memory Leak Fix (Camera Provider Unbind)** -> verified via inspection -> **FAIL** (Conditional check leaves camera active if disposed before future completes, see Finding 1)
- **Stability Fix (CameraX try-catch)** -> verified via inspection -> **PASS** (Try-catch prevents crashes on future get and binding errors)
- **Stability Fix (Gson parsing try-catch)** -> verified via inspection & local compilation -> **PASS** (Gson parsing handles errors gracefully and validates IP and token)
- **UI Cancellation (BackHandler)** -> verified via inspection -> **PASS** (Correctly intercepts back and calls `onCancelScan()`)
- **Permission Denial Exit** -> verified via inspection & local compilation -> **PASS** (Launcher handles permission result and cancels scanning if denied)
- **Build Success** -> verified via running `./gradlew assembleDebug` -> **PASS** (Successful build in 547ms)
- **Test Suite Success** -> verified via running `./gradlew test --rerun-tasks` -> **PASS** (All tests execute and pass successfully)

---

## Coverage Gaps

- **Resource cleanup of other background services** — risk level: **Low** — recommendation: **Accept risk** (the connection service has its own cleanup on destroy, which was verified).

---

## Unverified Items

- **Actual camera feed rendering** — reason not verified: No emulator/device present to test dynamic camera stream rendering.
