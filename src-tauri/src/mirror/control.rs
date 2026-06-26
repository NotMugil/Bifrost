use enigo::{
    Direction::Click,
    Enigo, Key, Keyboard, Mouse, Settings,
};
use std::sync::Mutex;
use log::error;

pub struct InputController {
    enigo: Mutex<Enigo>,
}

impl InputController {
    pub fn new() -> Result<Self, String> {
        let enigo = Enigo::new(&Settings::default()).map_err(|e| format!("Failed to init enigo: {:?}", e))?;
        Ok(Self {
            enigo: Mutex::new(enigo),
        })
    }

    pub fn move_mouse(&self, dx: i32, dy: i32) {
        let mut enigo = self.enigo.lock().unwrap();
        let _ = enigo.move_mouse(dx, dy, enigo::Coordinate::Rel);
    }

    pub fn move_mouse_abs(&self, x: i32, y: i32) {
        let mut enigo = self.enigo.lock().unwrap();
        let _ = enigo.move_mouse(x, y, enigo::Coordinate::Abs);
    }

    pub fn click_mouse(&self, button: &str) {
        let mut enigo = self.enigo.lock().unwrap();
        let btn = match button {
            "right" => enigo::Button::Right,
            "middle" => enigo::Button::Middle,
            _ => enigo::Button::Left,
        };
        let _ = enigo.button(btn, Click);
    }

    pub fn type_text(&self, text: &str) {
        let mut enigo = self.enigo.lock().unwrap();
        let _ = enigo.text(text);
    }

    pub fn key_press(&self, key: &str) {
        let mut enigo = self.enigo.lock().unwrap();
        let k = match key.to_lowercase().as_str() {
            "enter" => Key::Return,
            "backspace" => Key::Backspace,
            "space" => Key::Space,
            "tab" => Key::Tab,
            "escape" => Key::Escape,
            _ => {
                let _ = enigo.text(key);
                return;
            }
        };
        let _ = enigo.key(k, Click);
    }
}
