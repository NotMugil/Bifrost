# Scope: Verify Android Companion

## Architecture
- Kotlin Android companion application under `companion-app`.
- Incorporates QR scanner, WebSocket client/server communication, and platform-specific capabilities (clipboard, directory list).

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 3.1 | Compile Android App | Compile the Android app via `./gradlew assembleDebug` in `companion-app` | None | DONE |
| 3.2 | Scan QR Permission & Activity | Verify the QR Scanner UI has the proper runtime permissions and does not crash when opened | M3.1 | DONE |
