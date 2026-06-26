//! WebSocket-based file transfer (primary transfer method).
//!
//! Uses a WebSocket connection to the companion Android app
//! for high-speed bidirectional file transfers.

use super::progress::{TransferError, TransferProgress};

/// Manages file transfers over WebSocket connections.
///
/// This is the primary transfer method — faster and more flexible than
/// ADB push/pull, but requires the companion app to be running.
pub struct WsTransferManager {
    /// Whether the WebSocket connection is established.
    is_connected: bool,
}

impl WsTransferManager {
    /// Creates a new `WsTransferManager`.
    pub fn new() -> Self {
        Self {
            is_connected: false,
        }
    }

    /// Sends a file to the connected device over WebSocket.
    pub async fn send_file(&self, path: &str) -> Result<TransferProgress, TransferError> {
        let _ = path;
        todo!("Implement WebSocket file send")
    }

    /// Receives a file from the connected device and saves it locally.
    pub async fn receive_file(&self, save_to: &str) -> Result<TransferProgress, TransferError> {
        let _ = save_to;
        todo!("Implement WebSocket file receive")
    }
}

impl Default for WsTransferManager {
    fn default() -> Self {
        Self::new()
    }
}
