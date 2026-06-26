use log::{error, info};
use std::time::Duration;
use tokio::sync::broadcast;
use xcap::Monitor;
use image::codecs::jpeg::JpegEncoder;
use image::ImageEncoder;
use base64::{Engine as _, engine::general_purpose::STANDARD};

pub async fn start_screencast(sender: broadcast::Sender<String>) {
    info!("Starting PC Screencast thread");
    tokio::task::spawn_blocking(move || {
        let mut frames_failed = 0;
        loop {
            std::thread::sleep(Duration::from_millis(100)); // ~10 FPS to save CPU and bandwidth
            
            let monitors = match Monitor::all() {
                Ok(m) => m,
                Err(e) => {
                    error!("Failed to get monitors: {}", e);
                    frames_failed += 1;
                    if frames_failed > 10 { break; }
                    continue;
                }
            };
            
            if let Some(monitor) = monitors.first() {
                match monitor.capture_image() {
                    Ok(image) => {
                        let mut buffer = Vec::new();
                        let encoder = JpegEncoder::new_with_quality(&mut buffer, 60); // 60 quality for speed
                        
                        // Scale down image to improve performance (e.g., max 1280x720)
                        let scaled = image::imageops::resize(
                            &image, 
                            1280, 
                            720, 
                            image::imageops::FilterType::Nearest
                        );
                        
                        let rgb_scaled = image::DynamicImage::ImageRgba8(scaled).into_rgb8();
                        
                        if let Err(e) = encoder.write_image(rgb_scaled.as_raw(), rgb_scaled.width(), rgb_scaled.height(), image::ExtendedColorType::Rgb8) {
                            error!("Failed to encode image: {}", e);
                            continue;
                        }

                        let base64_data = STANDARD.encode(&buffer);
                        let payload = serde_json::json!({
                            "type": "video_frame",
                            "data": base64_data
                        });
                        
                        if sender.send(payload.to_string()).is_err() {
                            // No listeners connected, that's fine, we can keep looping
                            // but maybe we should stop and wait? For now, keep looping.
                        }
                    }
                    Err(e) => {
                        error!("Failed to capture screen: {}", e);
                    }
                }
            }
        }
    });
}
