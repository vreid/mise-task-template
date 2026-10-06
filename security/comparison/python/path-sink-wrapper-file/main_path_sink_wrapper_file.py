import os

from util_path_sink_wrapper_file import run_path_sink_wrapper_file


def path_sink_wrapper_file() -> None:
    """Comparison case."""
    run_path_sink_wrapper_file(os.environ.get("INPUT", ""))


if __name__ == "__main__":
    path_sink_wrapper_file()
