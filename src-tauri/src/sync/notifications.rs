//! Notification forwarding from Android to Linux.
//!
//! Receives notifications from the companion Android app and
//! displays them as native Linux desktop notifications.

use thiserror::Error;

/// Errors that can occur during sync operations.
#[derive(Error, Debug)]
pub enum SyncError {
    #[error("Sync connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Notification delivery failed: {0}")]
    NotificationFailed(String),

    #[error("Clipboard access failed: {0}")]
    ClipboardFailed(String),

    #[error("WebSocket error: {0}")]
    WebSocketError(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Manages notification forwarding from Android to Linux desktop.
pub struct NotificationManager {
    /// Whether the notification listener is active.
    is_listening: bool,
}

impl NotificationManager {
    /// Creates a new `NotificationManager`.
    pub fn new() -> Self {
        Self {
            is_listening: false,
        }
    }

    /// Shows a desktop notification forwarded from the Android device.
    pub async fn show_notification(
        &self,
        title: &str,
        body: &str,
        app_name: &str,
    ) -> Result<(), SyncError> {
        let _ = (title, body, app_name);
        todo!("Implement Linux desktop notification via D-Bus / libnotify")
    }
}

impl Default for NotificationManager {
    fn default() -> Self {
        Self::new()
    }
}
