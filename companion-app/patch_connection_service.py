import re

with open("app/src/main/java/com/example/bifrostcompanion/ConnectionService.kt", "r") as f:
    content = f.read()

companion_replacement = """    companion object {
        const val ACTION_START = "com.example.bifrostcompanion.START_CONNECTION"
        const val ACTION_STOP = "com.example.bifrostcompanion.STOP_CONNECTION"
        const val EXTRA_IP = "ip"
        const val EXTRA_PORT = "port"
        const val EXTRA_TOKEN = "token"
        
        var isConnected = false
        var currentWebSocket: WebSocket? = null
        val videoFrameFlow = kotlinx.coroutines.flow.MutableStateFlow<android.graphics.Bitmap?>(null)

        fun sendMessage(message: String) {
            currentWebSocket?.send(message)
        }
    }"""

content = re.sub(r'    companion object \{.*?\n    \}', companion_replacement, content, flags=re.DOTALL)

message_replacement = """                        "write_file" -> {
                            val path = json.optString("path")
                            val base64 = json.optString("data")
                            val file = java.io.File(path)
                            try {
                                val bytes = android.util.Base64.decode(base64, android.util.Base64.NO_WRAP)
                                file.writeBytes(bytes)
                                val response = JSONObject().apply {
                                    put("type", "write_success")
                                    put("path", path)
                                }.toString()
                                webSocket.send(response)
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }
                        "video_frame" -> {
                            val base64 = json.optString("data")
                            try {
                                val bytes = android.util.Base64.decode(base64, android.util.Base64.NO_WRAP)
                                val bitmap = android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                                videoFrameFlow.value = bitmap
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }"""

content = re.sub(r'                        "write_file" -> \{.*?\n                        \}', message_replacement, content, flags=re.DOTALL)

with open("app/src/main/java/com/example/bifrostcompanion/ConnectionService.kt", "w") as f:
    f.write(content)
