# Project Verification Plan

We will perform testing and verification of all features of the Bifrost desktop and Android companion application.

## Milestones

1. **Verify Desktop Backend Functionality** (Rust/Tauri)
   - Perform `cargo check` and `cargo build` in `src-tauri`.
   - Verify that devices are successfully detected using `adb devices -l` (detecting the OnePlus device).
   
2. **Verify React Frontend UI**
   - Build React app using `npm run build`.
   - Verify React frontend connects/functions correctly. Inspect `DevicePanel` for handling JSON payloads correctly without throwing a `TypeError`.

3. **Verify Android Companion App & E2E Connection**
   - Compile Android app via `./gradlew assembleDebug` in `companion-app`.
   - Verify Android app's QR Scanner UI has the proper runtime permissions and does not crash when opened.
   - Run verification checks on device connectivity and functionality (permissions, QR scanner, payload receipt/send).

4. **Verify E2E and Claims**
   - Perform forensic audits on the implementations to guarantee no cheating or dummy results.
   - Synthesize all verification results.
