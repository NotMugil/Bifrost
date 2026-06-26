use mdns_sd::{ServiceDaemon, ServiceInfo};
use std::collections::HashMap;
use thiserror::Error;
use log::info;

#[derive(Error, Debug)]
pub enum NetworkError {
    #[error("mDNS error: {0}")]
    MdnsError(String),
}

pub struct MdnsDiscovery {
    daemon: ServiceDaemon,
    service_type: String,
}

impl MdnsDiscovery {
    pub fn new() -> Result<Self, NetworkError> {
        let daemon = ServiceDaemon::new()
            .map_err(|e| NetworkError::MdnsError(e.to_string()))?;
        
        Ok(Self {
            daemon,
            service_type: "_bifrost._tcp.local.".to_string(),
        })
    }

    pub fn start_broadcasting(&self, port: u16) -> Result<(), NetworkError> {
        let my_name = hostname::get()
            .unwrap_or_else(|_| "Linux-Desktop".into())
            .to_string_lossy()
            .to_string();

        let properties = HashMap::from([
            ("type".to_string(), "desktop".to_string()),
            ("app".to_string(), "bifrost".to_string()),
        ]);

        let ips = local_ip_address::local_ip()
            .map(|ip| vec![ip])
            .unwrap_or_else(|_| vec![]);

        let ip_str = ips.first().map(|ip| ip.to_string()).unwrap_or_else(|| "".to_string());

        let my_info = ServiceInfo::new(
            &self.service_type,
            &my_name,
            &format!("{}.local.", my_name),
            &ip_str,
            port,
            Some(properties),
        ).map_err(|e| NetworkError::MdnsError(e.to_string()))?;

        self.daemon.register(my_info)
            .map_err(|e| NetworkError::MdnsError(e.to_string()))?;
        
        info!("Started mDNS broadcasting on port {}", port);
        Ok(())
    }

    pub fn stop_broadcasting(&self) -> Result<(), NetworkError> {
        self.daemon.unregister(&self.service_type)
            .map_err(|e| NetworkError::MdnsError(e.to_string()))?;
        info!("Stopped mDNS broadcasting");
        Ok(())
    }
}
