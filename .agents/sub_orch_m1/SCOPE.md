# Scope: Verify Desktop Backend

## Architecture
- Rust Tauri backend (`src-tauri`).
- Connects to ADB to discover devices and manage screen-casting.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1.1 | Compile Backend | Run `cargo check` and `cargo build` in `src-tauri` | None | PLANNED |
| 1.2 | adb Device Detection | Verify `adb devices -l` successfully detects the OnePlus device | None | PLANNED |
| 1.3 | Test Backend Run | Verify backend starts WebSocket and casting components without crashing | M1.1, M1.2 | PLANNED |
