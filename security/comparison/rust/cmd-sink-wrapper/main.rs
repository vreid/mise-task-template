use std::process::Command;

fn run(value: &str) {
    let _ = Command::new("sh").arg("-c").arg(value).status();
}

fn main() {
    run(&std::env::var("INPUT").unwrap_or_default());
}
