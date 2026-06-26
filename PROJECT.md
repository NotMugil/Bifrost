# Project: Bifrost Verification

## Architecture
- Bifrost consists of a Rust/Tauri desktop app that interacts with connected Android devices over USB/ADB and runs a local WebSocket server.
- The React frontend builds as static files and is served/displayed by Tauri's webview. It communicates with the Tauri Rust backend via Tauri commands.
- The companion-app is a native Android application compiling via Gradle, running a QR scanner to pair and establishing end-to-end WebSocket connections or using ADB port forwarding to exchange clipboard and directory listings.

## Milestones
| # | Name | Scope | Dependencies | Status | Conversation ID |
|---|------|-------|-------------|--------|-----------------|
| 1 | Verify Desktop Backend | Run cargo check/build in src-tauri, verify adb device detection | None | IN_PROGRESS | ae21f294-9201-40c4-a060-b55672b391fd |
| 2 | Verify React Frontend | Run npm run build, analyze DevicePanel JSON payload parsing | M1 | PLANNED | |
| 3 | Verify Android Companion | Gradle build companion-app, check permissions/activities, test scanner crash | None | DONE | b34d5257-5aa3-4f97-9f2e-67f8bcf219fc |
| 4 | Verify E2E & Integrity | Perform live E2E connectivity tests (clipboard, file payloads), run Forensic Audit | M1, M2, M3 | PLANNED | |

## Interface Contracts
### React Frontend ↔ Rust Backend (Tauri Commands)
- Rust backend exposes commands to React UI (e.g. adb device discovery, WebSocket pairing).
- Communication payloads must be typed and parsed correctly to avoid JSON serialization/deserialization mismatches.

### Android Companion ↔ Desktop (WebSocket / ADB)
- Payload format: JSON containing commands like `dir_list`, `clipboard`.
- Connection over WebSocket or forwarded port (using ADB).

## Code Layout
- `/src-tauri/` - Rust Tauri backend
- `/src/` - React frontend source code
- `/companion-app/` - Kotlin Android companion app source code
