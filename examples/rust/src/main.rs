use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let [text] = args.as_slice() else {
        eprintln!("Usage: word-count TEXT");
        return ExitCode::from(2);
    };
    println!("{}", word_count::count_words(text));
    ExitCode::SUCCESS
}
