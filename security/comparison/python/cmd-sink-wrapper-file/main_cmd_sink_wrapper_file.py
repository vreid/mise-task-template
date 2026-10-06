import os

from util_cmd_sink_wrapper_file import run_cmd_sink_wrapper_file


def cmd_sink_wrapper_file() -> None:
    """Comparison case."""
    run_cmd_sink_wrapper_file(os.environ.get("INPUT", ""))


if __name__ == "__main__":
    cmd_sink_wrapper_file()
