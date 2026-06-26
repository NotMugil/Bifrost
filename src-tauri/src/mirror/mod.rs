//! Screen mirroring module.
//!
//! Provides scrcpy-based screen mirroring, video stream handling,
//! and input control injection for connected Android devices.

pub mod control;
pub mod scrcpy;
pub mod stream;
pub mod screencast;

// Re-export key types.
pub use scrcpy::{MirrorError, ScrcpyManager};
pub use stream::VideoStreamServer;
pub use screencast::start_screencast;
