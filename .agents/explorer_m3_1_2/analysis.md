# Milestone 3.1: Compile Android App — Analysis Report

## Summary
The `companion-app` is an Android application developed with Jetpack Compose, targeting Android SDK 36 (Android 16 preview/developer release) and compiled using Gradle 9.1.0 with Android Gradle Plugin (AGP) 9.0.1.
The local environment is fully prepared: OpenJDK 21 is installed, the Android SDK path `/home/nirmal/Android/Sdk` is configured, and Android API platform 36 along with corresponding build-tools are present.
However, a compile error exists in the instrumented test file `app/src/androidTest/java/com/example/bifrostcompanion/ui/main/MainScreenTest.kt` due to an outdated call signature for `MainScreen`. While `./gradlew assembleDebug` compiles successfully (since it bypasses tests), any full build/verification (e.g. `./gradlew build`) will fail.

---

## 1. Project Configuration & Build Environment

### Gradle Wrapper and Properties
- **Gradle Version**: `9.1.0` (specified in `gradle/wrapper/gradle-wrapper.properties`).
- **Android Gradle Plugin (AGP)**: `9.0.1` (configured via version catalog `gradle/libs.versions.toml`).
- **Kotlin Version**: `2.3.20` (configured in version catalog).
- **JVM Daemon Heap**: `-Xmx2048m` with UTF-8 encoding.
- **Gradle Optimization Options**: `org.gradle.caching=true` and `org.gradle.configuration-cache=true` are enabled.

### Target and Minimum SDK Versions
- **Compile SDK**: `36` (Android 16)
- **Target SDK**: `36`
- **Min SDK**: `26` (Android 8.0)

### Java Version & Toolchains
- **Build JVM**: OpenJDK `21.0.11` is installed on the host system.
- **Toolchain Target**: Java `17` (configured via `kotlin { jvmToolchain(17) }` and `compileOptions { sourceCompatibility = JavaVersion.VERSION_17 }` in `app/build.gradle.kts`). OpenJDK 21 is fully compatible with targeting Java 17.

### Local Android SDK Components
- **SDK Path**: `/home/nirmal/Android/Sdk` (configured in `local.properties`).
- **Installed Platforms**: `android-30`, `android-31`, `android-33`, `android-34`, `android-35`, `android-36`, `android-36.1`. (SDK Platform 36 is present).
- **Installed Build-Tools**: `35.0.0`, `36.0.0`, `36.1.0`, `37.0.0`. (Build-tools matching SDK 36 are present).

---

## 2. Dependencies
The application relies on the following key dependencies (defined in `gradle/libs.versions.toml` and applied in `app/build.gradle.kts`):
- **Compose**: Jetpack Compose BOM `2026.03.01` (comprises Material3, UI, Tooling, etc.)
- **Navigation**: `androidx.navigation3:navigation3-runtime:1.0.1` and `androidx.navigation3:navigation3-ui:1.0.1`
- **Networking/JSON**: `com.squareup.okhttp3:okhttp:4.12.0` and `com.google.code.gson:gson:2.10.1`
- **CameraX**: `androidx.camera` core, camera2, lifecycle, and view libraries (`1.3.3`)
- **ML Kit Barcode**: `com.google.mlkit:barcode-scanning:17.2.0`

---

## 3. Analysis of Source Code & Python Patches
- Two python scripts are present in the directory: `patch_connection_service.py` and `patch_main_screen.py`.
- Examination of `app/src/main/java/com/example/bifrostcompanion/ConnectionService.kt` and `MainScreen.kt` reveals that these patches **have already been applied** to the codebase.
- The WebSocket messaging handling includes types like `"set_clipboard"`, `"list_dir"`, `"read_file"`, `"write_file"`, and `"video_frame"`.
- The screen rendering logic (including mouse interaction, keyboard/text input, and camera-based QR scanning) is fully implemented.

---

## 4. Current Issues and Potential Build Errors

### Obsolete Test File Compile Error
The only block preventing a clean, warning-free build/check run is the instrumented test file:
`app/src/androidTest/java/com/example/bifrostcompanion/ui/main/MainScreenTest.kt`

#### The Problem:
At line 17 of `MainScreenTest.kt`, the test invokes:
```kotlin
composeTestRule.setContent { MainScreen(FAKE_DATA) }
```
where `FAKE_DATA` is a `List<String>`.

However, in `MainScreen.kt` (lines 87-93), `MainScreen` is declared as:
```kotlin
fun MainScreen(
    config: ConnectionConfig?,
    isNotificationListenerEnabled: Boolean,
    onStartScan: () -> Unit,
    onStopConnection: () -> Unit,
    onCheckNotificationPermission: () -> Unit
)
```
This mismatch in function signature will cause a compiler failure when Gradle compiles the Android test sources (e.g. `./gradlew compileDebugAndroidTestSources` or `./gradlew build`).

#### The Impact:
- **`./gradlew assembleDebug`**: Will succeed, since it only compiles the main application sources and does not compile Android test sources.
- **`./gradlew build` / `./gradlew check`**: Will fail due to `MainScreenTest.kt` compilation errors.

---

## 5. Recommended Compilation Strategy
To successfully compile and verify the Android companion app, the Implementer should follow this plan:

### Step 1: Resolve the Test Compile Error
Since `MainScreenTest.kt` uses an obsolete template and does not align with the rewritten `MainScreen` UI (which uses config, connection logic, permissions, etc. rather than listing sample strings), the simplest fix is to clean up or delete this obsolete test.

**Proposed Change**: Delete `app/src/androidTest/java/com/example/bifrostcompanion/ui/main/MainScreenTest.kt` or rewrite it to test the main layout. Since it's a placeholder test that is completely outdated, deleting it is highly recommended.

### Step 2: Clean and Initialize Configuration Cache
Run the clean task to remove old build artifacts and verify the project setup:
```bash
./gradlew clean
```

### Step 3: Compile the Main Debug APK
Run the primary compilation command:
```bash
./gradlew assembleDebug
```
This generates the debug APK at:
`app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Verify the Build Artifact
Verify the presence of the output APK and check its size:
```bash
ls -l app/build/outputs/apk/debug/app-debug.apk
```
