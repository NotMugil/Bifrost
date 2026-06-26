//! Data models for Android device representation.
//!
//! Defines the [`Device`] struct and [`ConnectionType`] enum used throughout
//! Bifrost to represent connected or discovered Android devices.

use serde::{Deserialize, Serialize};

/// How the device is connected to the host.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ConnectionType {
    /// Connected via USB cable.
    Usb,
    /// Connected via Wi-Fi (TCP/IP).
    Wifi,
}

/// Represents a discovered or connected Android device.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    /// Unique device identifier (serial number or address).
    pub id: String,
    /// User-friendly device name.
    pub name: String,
    /// Device model string (e.g., "Pixel 8 Pro").
    pub model: String,
    /// How the device is connected.
    pub connection_type: ConnectionType,
    /// IP address if connected over Wi-Fi.
    pub ip_address: Option<String>,
    /// Whether the device is currently connected and reachable.
    pub is_connected: bool,
}

impl Device {
    /// Creates a new `Device` with the given parameters.
    pub fn new(
        id: String,
        name: String,
        model: String,
        connection_type: ConnectionType,
        ip_address: Option<String>,
    ) -> Self {
        Self {
            id,
            name,
            model,
            connection_type,
            ip_address,
            is_connected: false,
        }
    }
}
