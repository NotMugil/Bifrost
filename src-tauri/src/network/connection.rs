//! Connection lifecycle management.
//!
//! Manages the full connection lifecycle — from discovery through
//! pairing, connecting, and automatic reconnection.

use serde::{Deserialize, Serialize};

use super::mdns::NetworkError;
use crate::adb::Device;

/// The current state of the connection to a device.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ConnectionState {
    /// No device connected.
    Disconnected,
    /// Scanning for available devices.
    Discovering,
    /// Pairing with a new device.
    Pairing,
    /// Establishing connection to a paired device.
    Connecting,
    /// Fully connected and operational.
    Connected,
    /// Lost connection, attempting to reconnect.
    Reconnecting,
}

impl Default for ConnectionState {
    fn default() -> Self {
        Self::Disconnected
    }
}

/// Manages the connection lifecycle to an Android device.
pub struct ConnectionManager {
    /// Current connection state.
    state: ConnectionState,
}

impl ConnectionManager {
    /// Creates a new `ConnectionManager` in the Disconnected state.
    pub fn new() -> Self {
        Self {
            state: ConnectionState::default(),
        }
    }

    /// Returns the current connection state.
    pub fn state(&self) -> &ConnectionState {
        &self.state
    }

    /// Initiates a connection to the given device.
    pub async fn connect(&mut self, device: &Device) -> Result<(), NetworkError> {
        let _ = device;
        todo!("Implement device connection")
    }

    /// Disconnects from the currently connected device.
    pub async fn disconnect(&mut self) -> Result<(), NetworkError> {
        todo!("Implement device disconnection")
    }
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}
