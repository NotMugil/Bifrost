//! File transfer module.
//!
//! Provides both WebSocket-based (primary) and ADB-based (fallback)
//! file transfer mechanisms, along with shared progress tracking.

pub mod adb_transfer;
pub mod progress;
pub mod ws_transfer;

// Re-export key types.
pub use adb_transfer::AdbTransferManager;
pub use progress::{TransferError, TransferProgress, TransferStatus};
pub use ws_transfer::WsTransferManager;
