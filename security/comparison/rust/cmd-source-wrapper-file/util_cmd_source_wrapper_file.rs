pub fn read() -> String {
    std::env::var("INPUT").unwrap_or_default()
}
