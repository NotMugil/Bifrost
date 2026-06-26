use std::sync::Mutex;
use arboard::Clipboard;
use log::{error, info};

pub struct ClipboardManager {
    clipboard: Mutex<Clipboard>,
}

impl ClipboardManager {
    pub fn new() -> Result<Self, String> {
        match Clipboard::new() {
            Ok(cb) => Ok(Self {
                clipboard: Mutex::new(cb),
            }),
            Err(e) => {
                error!("Failed to initialize clipboard: {}", e);
                Err(e.to_string())
            }
        }
    }

    pub fn get_text(&self) -> Result<String, String> {
        let mut cb = self.clipboard.lock().unwrap();
        cb.get_text().map_err(|e| e.to_string())
    }

    pub fn set_text(&self, content: &str) -> Result<(), String> {
        let mut cb = self.clipboard.lock().unwrap();
        cb.set_text(content.to_string()).map_err(|e| e.to_string())
    }
}
