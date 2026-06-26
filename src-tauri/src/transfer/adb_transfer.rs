//! ADB-based file transfer (fallback transfer method).
//!
//! Uses ADB push/pull as a fallback when the WebSocket-based
//! transfer is unavailable (e.g., companion app not running).

use super::progress::{TransferError, TransferProgress};

/// Manages file transfers using ADB push/pull commands.
///
/// This is the fallback transfer method — works without the companion
/// app but is slower than WebSocket transfers.
pub struct AdbTransferManager {
    /// Whether an ADB connection is available.
    is_connected: bool,
}

impl AdbTransferManager {
    /// Creates a new `AdbTransferManager`.
    pub fn new() -> Self {
        Self {
            is_connected: false,
        }
    }

    /// Sends a file to the device using `adb push`.
    pub async fn send_file(&self, local: &str, remote: &str) -> Result<TransferProgress, TransferError> {
        let _ = (local, remote);
        todo!("Implement ADB push file transfer")
    }

    /// Receives a file from the device using `adb pull`.
    pub async fn receive_file(&self, remote: &str, local: &str) -> Result<TransferProgress, TransferError> {
        let _ = (remote, local);
        todo!("Implement ADB pull file transfer")
    }
}

impl Default for AdbTransferManager {
    fn default() -> Self {
        Self::new()
    }
}
