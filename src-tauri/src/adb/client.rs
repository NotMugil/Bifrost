use std::process::{Command, Child, Stdio};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AdbError {
    #[error("ADB execution error: {0}")]
    ExecutionError(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

pub struct AdbClient {
    serial: String,
}

impl AdbClient {
    pub fn new(serial: String) -> Self {
        Self { serial }
    }

    pub fn push_file(&self, local_path: &str, remote_path: &str) -> Result<(), AdbError> {
        let status = Command::new("adb")
            .arg("-s")
            .arg(&self.serial)
            .arg("push")
            .arg(local_path)
            .arg(remote_path)
            .status()?;

        if !status.success() {
            return Err(AdbError::ExecutionError("Failed to push file".into()));
        }
        Ok(())
    }

    pub fn forward_port(&self, local_port: u16, remote_abstract_name: &str) -> Result<(), AdbError> {
        let status = Command::new("adb")
            .arg("-s")
            .arg(&self.serial)
            .arg("forward")
            .arg(format!("tcp:{}", local_port))
            .arg(format!("localabstract:{}", remote_abstract_name))
            .status()?;

        if !status.success() {
            return Err(AdbError::ExecutionError("Failed to forward port".into()));
        }
        Ok(())
    }

    pub fn remove_forward(&self, local_port: u16) -> Result<(), AdbError> {
        let _ = Command::new("adb")
            .arg("-s")
            .arg(&self.serial)
            .arg("forward")
            .arg("--remove")
            .arg(format!("tcp:{}", local_port))
            .status();
        Ok(())
    }

    pub fn spawn_shell(&self, cmd: &str) -> Result<Child, AdbError> {
        let child = Command::new("adb")
            .arg("-s")
            .arg(&self.serial)
            .arg("shell")
            .arg(cmd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        Ok(child)
    }
}
