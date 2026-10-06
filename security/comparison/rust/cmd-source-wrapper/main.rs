use std::process::Command;

fn read() -> String {
    std::env::var("INPUT").unwrap_or_default()
}

fn main() {
    let _ = Command::new("sh").arg("-c").arg(read()).status();
}
