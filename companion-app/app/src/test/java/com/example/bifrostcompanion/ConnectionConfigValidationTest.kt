package com.example.bifrostcompanion

import com.google.gson.Gson
import org.junit.Assert.*
import org.junit.Test

class ConnectionConfigValidationTest {

    private val gson = Gson()

    private fun isValidConfig(qrResult: String): Boolean {
        return try {
            val parsed = gson.fromJson(qrResult, ConnectionConfig::class.java)
            parsed != null && !parsed.ip.isNullOrEmpty() && !parsed.token.isNullOrEmpty() && parsed.port in 1..65535
        } catch (e: Exception) {
            false
        }
    }

    @Test
    fun testValidConnectionConfig() {
        val qrResult = """{"ip":"192.168.1.10","port":8080,"token":"secret_token"}"""
        assertTrue(isValidConfig(qrResult))
    }

    @Test
    fun testInvalidPortZero() {
        val qrResult = """{"ip":"192.168.1.10","port":0,"token":"secret_token"}"""
        assertFalse(isValidConfig(qrResult))
    }

    @Test
    fun testInvalidPortOutOfRange() {
        val qrResult = """{"ip":"192.168.1.10","port":65536,"token":"secret_token"}"""
        assertFalse(isValidConfig(qrResult))
    }

    @Test
    fun testInvalidPortNegative() {
        val qrResult = """{"ip":"192.168.1.10","port":-5,"token":"secret_token"}"""
        assertFalse(isValidConfig(qrResult))
    }

    @Test
    fun testMissingFields() {
        val qrResult = """{"port":8080,"token":"secret_token"}"""
        assertFalse(isValidConfig(qrResult))
    }
}
