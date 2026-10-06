fn main() {
    let value = std::env::var("INPUT").unwrap_or_default();
    if ["a.txt", "b.txt"].contains(&value.as_str()) {
        let _ = std::fs::read_to_string(&value);
    }
}
