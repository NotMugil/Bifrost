use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DeviceProfile {
    pub id: String,
    pub name: String,
    pub model: String,
    pub last_ip: Option<String>,
    pub auto_connect: bool,
}
