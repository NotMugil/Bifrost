package com.example.bifrostcompanion

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONObject

class NotificationSyncService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (sbn == null || !ConnectionService.isConnected.value) return
        
        val packageName = sbn.packageName
        val extras = sbn.notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        if (title.isBlank() && text.isBlank()) return

        // Send to WebSocket if connected
        val ws = ConnectionService.currentWebSocket
        if (ws != null && ConnectionService.isConnected.value) {
            val payload = JSONObject().apply {
                put("type", "notification")
                put("app", packageName)
                put("title", title)
                put("text", text)
            }.toString()
            
            ws.send(payload)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // Handle removal if needed in future
    }
}
