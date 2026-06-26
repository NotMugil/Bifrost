package com.example.bifrostcompanion

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import org.json.JSONObject
import androidx.compose.ui.Alignment

@Composable
fun RemotePCScreen() {
    val bitmap = ConnectionService.videoFrameFlow.collectAsState().value
    var textInput by remember { mutableStateOf("") }
    var showKeyboard by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        if (bitmap != null) {
            Image(
                bitmap = bitmap.asImageBitmap(),
                contentDescription = "Remote PC Screen",
                contentScale = androidx.compose.ui.layout.ContentScale.FillBounds,
                modifier = Modifier
                    .fillMaxSize()
                    .pointerInput(Unit) {
                        detectTapGestures { offset ->
                            val scaledX = (offset.x / size.width) * bitmap.width
                            val scaledY = (offset.y / size.height) * bitmap.height
                            ConnectionService.sendMessage(JSONObject().apply {
                                put("type", "mouse_click")
                                put("button", "left")
                                put("x", scaledX)
                                put("y", scaledY)
                            }.toString())
                        }
                    }
                    .pointerInput(Unit) {
                        detectDragGestures { change, dragAmount ->
                            change.consume()
                            ConnectionService.sendMessage(JSONObject().apply {
                                put("type", "mouse_move")
                                put("dx", dragAmount.x)
                                put("dy", dragAmount.y)
                            }.toString())
                        }
                    }
            )
        } else {
            Text("Waiting for video frame...", modifier = Modifier.align(Alignment.Center))
        }

        if (showKeyboard) {
            TextField(
                value = textInput,
                onValueChange = { newValue ->
                    if (newValue.length > textInput.length) {
                        val key = newValue.last().toString()
                        ConnectionService.sendMessage(JSONObject().apply {
                            put("type", "text_input")
                            put("text", key)
                        }.toString())
                    } else if (newValue.length < textInput.length) {
                        ConnectionService.sendMessage(JSONObject().apply {
                            put("type", "key_press")
                            put("key", "backspace")
                        }.toString())
                    }
                    textInput = newValue
                },
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(bottom = 80.dp)
            )
        }

        FloatingActionButton(
            onClick = { showKeyboard = !showKeyboard },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
        ) {
            Text("KB")
        }
    }
}
