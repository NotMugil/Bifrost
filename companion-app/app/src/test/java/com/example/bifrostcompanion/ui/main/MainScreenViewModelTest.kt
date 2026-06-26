package com.example.bifrostcompanion.ui.main

import com.example.bifrostcompanion.data.DefaultDataRepository
import junit.framework.TestCase.assertEquals
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test

class MainScreenViewModelTest {
  @Test
  fun testRepository() = runTest {
    val repository = DefaultDataRepository()
    assertEquals(repository.data.first(), listOf("Android"))
  }
}
