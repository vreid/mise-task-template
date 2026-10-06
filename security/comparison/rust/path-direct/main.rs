fn main() {
    let value = std::env::var("INPUT").unwrap_or_default();
    let _ = std::fs::read_to_string(&value);
}
