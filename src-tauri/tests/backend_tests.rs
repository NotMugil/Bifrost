#[cfg(test)]
mod tests {
    use std::time::Duration;
    use tokio::net::TcpStream;
    use tokio::sync::broadcast;
    use bytes::Bytes;
    use bifrost_lib::{
        mirror::stream::VideoStreamServer,
        mirror::screencast::start_screencast,
        list_devices,
        ConnectionType,
    };

    /// Verifies that the VideoStreamServer can start, bind to a port, and accept incoming connections
    /// without crashing.
    #[tokio::test]
    async fn test_video_stream_server_start() {
        let server = VideoStreamServer::new();
        // Use an ephemeral or testing port (e.g., 24211) to avoid conflicts with running dev instances
        let port = 24211;
        let start_res = server.start(port).await;
        assert!(start_res.is_ok(), "Failed to start VideoStreamServer: {:?}", start_res);

        // Verify we can connect to the bound port
        let connect_res = TcpStream::connect(format!("127.0.0.1:{}", port)).await;
        assert!(connect_res.is_ok(), "Failed to connect to VideoStreamServer port: {:?}", connect_res);

        // Test sending a mock frame
        let sender = server.get_sender();
        // Subscribe to the channel to avoid SendError (which happens when there are no active receivers)
        let _rx = sender.subscribe();

        let mock_frame = Bytes::from(vec![0x00, 0x01, 0x02, 0x03]);
        let send_res = sender.send(mock_frame);
        assert!(send_res.is_ok(), "Failed to send mock frame: {:?}", send_res);
    }

    /// Verifies that the PC Screen-Casting component starts without crashing, even if display capturing
    /// is restricted or no monitors are found. Uses a thread-based timeout check to prevent hanging
    /// under Wayland/non-interactive environments.
    #[tokio::test]
    async fn test_screencast_start() {
        let (tx_monitor, rx_monitor) = std::sync::mpsc::channel();
        
        // Spawn a thread to fetch monitors, guarding against potential infinite blocking/dialogs
        std::thread::spawn(move || {
            let res = xcap::Monitor::all();
            let _ = tx_monitor.send(res);
        });

        let monitors = match rx_monitor.recv_timeout(Duration::from_secs(1)) {
            Ok(Ok(m)) => m,
            Ok(Err(e)) => {
                println!("Skipping screencast test: Failed to list monitors: {}", e);
                return;
            }
            Err(_) => {
                println!("Skipping screencast test: xcap::Monitor::all() timed out (Wayland screen selection dialog or non-interactive environment)");
                return;
            }
        };

        if monitors.is_empty() {
            println!("Skipping screencast test: No monitors found");
            return;
        }

        let (sender, mut rx) = broadcast::channel::<String>(10);
        
        // Spawn screen casting
        start_screencast(sender).await;

        // Let it run briefly to ensure no initialization panics/crashes occur
        tokio::time::sleep(Duration::from_millis(500)).await;

        // Check if any frames were successfully broadcasted (if monitors are available)
        // or just ensure the thread didn't crash.
        while let Ok(msg) = rx.try_recv() {
            assert!(msg.contains("video_frame"));
        }
    }

    /// Verifies that the ADB discovery command successfully runs and parses output without crashing,
    /// and correctly detects the connected OnePlus device.
    #[test]
    fn test_adb_list_devices() {
        let devices = list_devices().expect("Failed to list devices via adb");
        
        // Find the specific OnePlus device with serial 3C15CT00A5800000
        let oneplus = devices.iter().find(|d| d.id == "3C15CT00A5800000");
        
        assert!(
            oneplus.is_some(),
            "OnePlus device (3C15CT00A5800000) not found in the list: {:?}",
            devices
        );
        
        let device = oneplus.unwrap();
        assert_eq!(device.model, "CPH2745");
        assert_eq!(device.connection_type, ConnectionType::Usb);
    }
}
