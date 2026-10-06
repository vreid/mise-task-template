mod util_path_source_wrapper_file;

fn main() {
    let _ = std::fs::read_to_string(util_path_source_wrapper_file::read());
}
