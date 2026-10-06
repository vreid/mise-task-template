use std::process::Command;
mod util_cmd_source_wrapper_file;

fn main() {
    let _ = Command::new("sh").arg("-c").arg(util_cmd_source_wrapper_file::read()).status();
}
