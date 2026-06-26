//! Sync module — real-time synchronization between Android and Linux.
//!
//! Handles notification forwarding, clipboard sync, and the WebSocket
//! transport layer that connects to the companion Android app.

pub mod clipboard;
pub mod notifications;
pub mod websocket;

// Re-export key types.
pub use clipboard::ClipboardManager;
pub use notifications::{NotificationManager, SyncError};
pub use websocket::WsServer;
