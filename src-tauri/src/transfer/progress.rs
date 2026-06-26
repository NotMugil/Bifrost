//! Transfer progress tracking and status types.
//!
//! Shared types for tracking file transfer progress across
//! both WebSocket and ADB transfer backends.

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Errors that can occur during file transfers.
#[derive(Error, Debug)]
pub enum TransferError {
    #[error("Transfer failed: {0}")]
    Failed(String),

    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Transfer cancelled")]
    Cancelled,

    #[error("Connection lost during transfer")]
    ConnectionLost,

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

/// Current progress of a file transfer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferProgress {
    /// Number of bytes transferred so far.
    pub bytes_transferred: u64,
    /// Total size of the file in bytes.
    pub total_bytes: u64,
    /// Current transfer speed in bytes per second.
    pub speed_bps: u64,
    /// Name of the file being transferred.
    pub filename: String,
    /// Current status of the transfer.
    pub status: TransferStatus,
}

/// Status of a file transfer.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransferStatus {
    /// Transfer is queued but hasn't started.
    Pending,
    /// Transfer is actively moving data.
    InProgress,
    /// Transfer completed successfully.
    Completed,
    /// Transfer failed with an error message.
    Failed(String),
    /// Transfer was cancelled by the user.
    Cancelled,
}

impl TransferProgress {
    /// Returns the transfer completion percentage (0.0–100.0).
    pub fn percentage(&self) -> f64 {
        if self.total_bytes == 0 {
            return 0.0;
        }
        (self.bytes_transferred as f64 / self.total_bytes as f64) * 100.0
    }
}
