use std::process::Command;

pub fn run(value: &str) {
    let _ = Command::new("sh").arg("-c").arg(value).status();
}
