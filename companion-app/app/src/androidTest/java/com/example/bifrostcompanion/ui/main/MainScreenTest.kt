package com.example.bifrostcompanion.ui.main

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.example.bifrostcompanion.MainScreen
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class MainScreenTest {

  @get:Rule val composeTestRule = createAndroidComposeRule<ComponentActivity>()

  @Before
  fun setup() {
    composeTestRule.setContent {
      MainScreen(
        config = null,
        isNotificationListenerEnabled = false,
        onStartScan = {},
        onStopConnection = {},
        onCheckNotificationPermission = {}
      )
    }
  }

  @Test
  fun firstItem_exists() {
    composeTestRule.onNodeWithText("Scan QR Code to Connect").assertExists()
  }
}
