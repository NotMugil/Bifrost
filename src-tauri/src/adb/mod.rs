//! ADB integration module.
//!
//! Provides device communication, discovery, and management through
//! the Android Debug Bridge.

pub mod client;
pub mod device;
pub mod discovery;

// Re-export key types for convenient access.
pub use client::{AdbClient, AdbError};
pub use device::{ConnectionType, Device};
pub use discovery::DeviceDiscovery;
