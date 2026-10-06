fn read() -> String {
    std::env::var("INPUT").unwrap_or_default()
}

fn main() {
    let _ = std::fs::read_to_string(read());
}
