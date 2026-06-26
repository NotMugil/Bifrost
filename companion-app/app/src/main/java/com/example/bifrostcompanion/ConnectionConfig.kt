package com.example.bifrostcompanion

import com.google.gson.annotations.SerializedName

data class ConnectionConfig(
    @SerializedName("ip") val ip: String,
    @SerializedName("port") val port: Int,
    @SerializedName("token") val token: String
)
