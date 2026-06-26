# Analysis: Milestone 3.1 - Compile Android App

This document presents the codebase investigation and compilation plan for the `companion-app` Android application.

## 1. Project Configuration & Build Settings

An examination of the configuration files in `/home/nirmal/Development/Bifrost/companion-app/` reveals the following specifications:

*   **Gradle Wrapper (`gradle-wrapper.properties`)**:
    *   Gradle Version: `9.1.0`
    *   URL: `https://services.gradle.org/distributions/gradle-9.1.0-bin.zip`
*   **Settings (`settings.gradle.kts`)**:
    *   Root Project Name: `"Bifrost Companion"`
    *   Modules: `:app`
    *   Plugin Resolver: Foojay resolver convention plugin (`org.gradle.toolchains.foojay-resolver-convention` version `1.0.0`).
*   **Android Gradle Plugin (AGP) & Kotlin (`gradle/libs.versions.toml`)**:
    *   AGP version: `9.0.1` (`com.android.application`)
    *   Kotlin version: `2.3.20`
*   **Target & Build SDKs (`app/build.gradle.kts`)**:
    *   `compileSdk = 36`
    *   `minSdk = 26`
    *   `targetSdk = 36`
    *   Kotlin JVM Toolchain: `17`
    *   Java Source/Target Compatibility: `JavaVersion.VERSION_17`
*   **Local Properties (`local.properties`)**:
    *   Android SDK Path: `/home/nirmal/Android/Sdk`

## 2. Environment Assessment (SDKs & JDKs)

To verify if the environment is ready for compilation, a read-only assessment of the local system was conducted:

1.  **JDK Availability**:
    *   The system-wide JVM is `OpenJDK 21.0.11` located at `/usr/lib/jvm/java-21-openjdk`.
    *   Gradle's JVM Toolchain is configured to use **Java 17**.
    *   *Verification Result*: The directory `~/.gradle/jdks/` contains a pre-downloaded, cached JDK 17: `eclipse_adoptium-17-amd64-linux.2` (extracted from `OpenJDK17U-jdk_x64_linux_hotspot_17-any#20vendor-17.0.19_10.tar.gz`). Gradle will automatically pick this up and use it for compilation offline.
2.  **Android SDK Platforms & Build Tools**:
    *   *Verification Result*: Running `android sdk list` shows:
        *   `platforms/android-36` is installed.
        *   `build-tools/36.0.0`, `build-tools/36.1.0`, and `build-tools/37.0.0` are installed.
        *   Therefore, the build environment meets the SDK requirement of `compileSdk = 36`.

## 3. Dependency Resolution

Running `./gradlew :app:dependencies --configuration debugRuntimeClasspath` verified that all application dependencies resolve successfully without conflicts. The dependencies include:
*   AndroidX Jetpack Compose (BOM `2026.03.01`, including Material 3, UI, Tooling, Activity, Lifecycle)
*   OkHttp 4.12.0 for WebSockets
*   Gson 2.10.1 for JSON parsing
*   CameraX 1.3.3 for QR code scanning
*   ML Kit Barcode Scanning 17.2.0

## 4. Current Issues & Potential Build Errors

We have identified **two major compilation errors** within the boilerplate test files. Although `./gradlew assembleDebug` does not compile test sources by default and will succeed, running `./gradlew build` or `./gradlew test` will fail:

1.  **Broken Unit Test (`MainScreenViewModelTest.kt`)**:
    *   **File Path**: `app/src/test/java/com/example/bifrostcompanion/ui/main/MainScreenViewModelTest.kt`
    *   **Problem**: It attempts to instantiate `MainScreenViewModel` and check `MainScreenUiState.Loading` on lines 14-15 and 20-21. Neither `MainScreenViewModel` nor `MainScreenUiState` is defined anywhere in the codebase. State management in this app is handled directly inside the composables using `remember { mutableStateOf(...) }` without a separate ViewModel class.
2.  **Broken Instrumented Test (`MainScreenTest.kt`)**:
    *   **File Path**: `app/src/androidTest/java/com/example/bifrostcompanion/ui/main/MainScreenTest.kt`
    *   **Problem 1**: On line 17, it calls `MainScreen(FAKE_DATA)`. The actual `MainScreen` composable function (defined in `MainScreen.kt`) does not accept a list parameter; its signature is:
        ```kotlin
        fun MainScreen(
            config: ConnectionConfig?,
            isNotificationListenerEnabled: Boolean,
            onStartScan: () -> Unit,
            onStopConnection: () -> Unit,
            onCheckNotificationPermission: () -> Unit
        )
        ```
    *   **Problem 2**: The test file package is `com.example.bifrostcompanion.ui.main` but `MainScreen` is declared in `com.example.bifrostcompanion`. The test file lacks an import for `com.example.bifrostcompanion.MainScreen`, which causes another compiler error.

## 5. Recommended Compilation Strategy & Action Plan

To compile the Android app successfully, the Worker should execute the following steps:

### Option A: Standard Build (Ignoring Test Errors)
If only the debug APK is needed, run:
```bash
./gradlew assembleDebug
```
This task graph only compiles the main and debug source sets, successfully bypassing the broken test files. The output APK will be generated at:
`companion-app/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Clean Build with Fixed Tests (Recommended)
To ensure the project passes all checks, tests, and builds cleanly (e.g. `./gradlew build`), apply the following fixes:

1.  **Replace `MainScreenViewModelTest.kt`**:
    Replace the contents of `app/src/test/java/com/example/bifrostcompanion/ui/main/MainScreenViewModelTest.kt` with the content of `proposed_MainScreenViewModelTest.kt` (located in the agent directory). This tests the existing `DefaultDataRepository` instead.
2.  **Replace `MainScreenTest.kt`**:
    Replace the contents of `app/src/androidTest/java/com/example/bifrostcompanion/ui/main/MainScreenTest.kt` with the content of `proposed_MainScreenTest.kt` (located in the agent directory). This imports `MainScreen` and supplies the correct signature parameters, testing that the QR code scan button is present.
3.  **Compile & Run Build**:
    Run the following commands:
    ```bash
    ./gradlew clean assembleDebug
    ./gradlew test
    ```
