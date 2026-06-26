<div align="center">

# 🌉 Bifrost

**Connect your Android phone to your Linux desktop — wirelessly.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Linux](https://img.shields.io/badge/Platform-Linux-orange.svg)](#)
[![Built with Tauri](https://img.shields.io/badge/Built%20with-Tauri%20v2-blueviolet.svg)](https://tauri.app)

*The open-source Linux alternative to O+ Connect*

</div>

---

## ✨ Features

| Feature | Wireless (Wi-Fi) | USB |
|---|:---:|:---:|
| 📱 **Screen Mirroring** — Cast your phone screen to your PC | ✅ | ✅ |
| 📁 **File Transfer** — Drag-and-drop files between devices | ✅ | ✅ |
| 🔔 **Notification Sync** — See phone notifications on your desktop | ✅ | — |
| 📋 **Clipboard Sharing** — Copy on phone, paste on PC (and vice versa) | ✅ | — |
| 📞 **SMS/Call Sync** — View call logs and messages | ✅ | — |
| 🖱️ **Remote PC Control** — Use your phone as a trackpad/keyboard | ✅ | — |
| 🔗 **QR Code Pairing** — Instant wireless setup | ✅ | — |

> **Wireless-First:** All features work over Wi-Fi (same network). No cables needed. USB is available as an optional fallback.

> **Brand Agnostic:** Works with **any Android device** (Android 7.0+), not just OPPO/OnePlus/Realme.

## 🏗️ Tech Stack

- **Desktop App:** [Tauri v2](https://tauri.app) (Rust backend + React/TypeScript frontend)
- **Styling:** Tailwind CSS v4
- **Screen Mirroring:** scrcpy protocol
- **Companion App:** Kotlin + Jetpack Compose *(coming soon)*
- **Communication:** WebSocket (wireless) + ADB (fallback)

## 🚀 Building from Source

### Prerequisites

**Arch Linux / CachyOS:**
```bash
sudo pacman -S --needed nodejs npm rust webkit2gtk-4.1 openssl pkgconf base-devel gtk3 libsoup3
```

**Ubuntu / Debian:**
```bash
sudo apt install -y nodejs npm rustc cargo libwebkit2gtk-4.1-dev libssl-dev pkg-config build-essential libgtk-3-dev libsoup-3.0-dev
```

**Fedora:**
```bash
sudo dnf install -y nodejs npm rust cargo webkit2gtk4.1-devel openssl-devel pkgconf gcc gtk3-devel libsoup3-devel
```

### Build & Run

```bash
# Clone the repository
git clone https://github.com/yourusername/Bifrost.git
cd Bifrost

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## 📱 Android Companion App

For notification sync, clipboard sharing, SMS/call sync, and remote PC control, install the **Bifrost companion app** on your Android phone.

> *Coming soon — the companion app is currently in development.*

Screen mirroring and file transfer work without the companion app using ADB.

## 🗺️ Roadmap

- [x] Phase 1: Project foundation & UI shell
- [ ] Phase 2: Wireless discovery & pairing
- [ ] Phase 3: Android companion app
- [ ] Phase 4: Screen mirroring
- [ ] Phase 5: File transfer & sync
- [ ] Phase 6: Remote PC control
- [ ] Phase 7: Polish & packaging

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for the Linux community</sub>
</div>
