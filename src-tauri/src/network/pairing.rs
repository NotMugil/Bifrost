use crate::network::mdns::NetworkError;
use base64::{engine::general_purpose, Engine as _};
use image::{Luma, ImageEncoder};
use qrcode::QrCode;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct PairingData {
    pub ip: String,
    pub port: u16,
    pub token: String,
}

pub struct PairingManager {
    pub token: String,
    port: u16,
}

impl PairingManager {
    pub fn new(port: u16, token: String) -> Self {
        Self {
            token,
            port,
        }
    }

    pub fn generate_qr_code(&self) -> Result<String, NetworkError> {
        let ip = local_ip_address::local_ip()
            .map(|ip| ip.to_string())
            .unwrap_or_else(|_| "127.0.0.1".to_string());

        let data = PairingData {
            ip,
            port: self.port,
            token: self.token.clone(),
        };

        let json = serde_json::to_string(&data)
            .map_err(|e| NetworkError::MdnsError(format!("Serialization error: {}", e)))?;

        let code = QrCode::new(json.as_bytes())
            .map_err(|e| NetworkError::MdnsError(format!("QR code error: {}", e)))?;

        let image = code.render::<Luma<u8>>().build();
        let mut png_bytes = Vec::new();
        let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
        
        encoder.write_image(
            &image,
            image.width(),
            image.height(),
            image::ExtendedColorType::L8,
        ).map_err(|e| NetworkError::MdnsError(format!("Image error: {}", e)))?;

        let b64 = general_purpose::STANDARD.encode(&png_bytes);
        Ok(format!("data:image/png;base64,{}", b64))
    }
}
