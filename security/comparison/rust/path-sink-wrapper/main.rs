fn run(value: &str) {
    let _ = std::fs::read_to_string(value);
}

fn main() {
    run(&std::env::var("INPUT").unwrap_or_default());
}
