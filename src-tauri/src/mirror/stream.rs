use std::net::SocketAddr;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use bytes::Bytes;
use log::{info, error};
use futures_util::{SinkExt, StreamExt};

pub struct VideoStreamServer {
    sender: broadcast::Sender<Bytes>,
}

impl VideoStreamServer {
    pub fn new() -> Self {
        let (sender, _) = broadcast::channel(100);
        Self { sender }
    }

    pub fn get_sender(&self) -> broadcast::Sender<Bytes> {
        self.sender.clone()
    }

    pub async fn start(&self, port: u16) -> Result<(), String> {
        let addr = format!("127.0.0.1:{}", port);
        let listener = TcpListener::bind(&addr).await.map_err(|e| e.to_string())?;
        info!("Video WebSocket Server listening on {}", addr);

        let sender = self.sender.clone();

        tokio::spawn(async move {
            while let Ok((stream, _)) = listener.accept().await {
                let sender_clone = sender.clone();
                tokio::spawn(async move {
                    if let Ok(ws_stream) = tokio_tungstenite::accept_async(stream).await {
                        let (mut write, _) = ws_stream.split();
                        let mut rx = sender_clone.subscribe();

                        while let Ok(msg) = rx.recv().await {
                            if write.send(tokio_tungstenite::tungstenite::Message::Binary(msg.into())).await.is_err() {
                                break;
                            }
                        }
                    }
                });
            }
        });

        Ok(())
    }
}
