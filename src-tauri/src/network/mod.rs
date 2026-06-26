//! Network module — device discovery, pairing, and connection management.
//!
//! Handles mDNS discovery, QR-code/manual pairing, and the full
//! connection lifecycle between the Linux desktop and Android device.

pub mod connection;
pub mod mdns;
pub mod pairing;

// Re-export key types.
pub use connection::{ConnectionManager, ConnectionState};
pub use mdns::{MdnsDiscovery, NetworkError};
pub use pairing::PairingManager;
