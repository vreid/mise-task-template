mod util_path_sink_wrapper_file;

fn main() {
    util_path_sink_wrapper_file::run(&std::env::var("INPUT").unwrap_or_default());
}
