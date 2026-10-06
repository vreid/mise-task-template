use std::process::Command;

fn main() {
    let value = std::env::var("INPUT").unwrap_or_default();
    let _ = Command::new("sh").arg("-c").arg(&value).status();
}
