mod util_cmd_sink_wrapper_file;

fn main() {
    util_cmd_sink_wrapper_file::run(&std::env::var("INPUT").unwrap_or_default());
}
