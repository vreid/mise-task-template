import os
import subprocess


def run_path_sink_wrapper(value: str) -> None:
    """Comparison case."""
    with open(value, encoding="utf-8") as handle:
        print(handle.read())


def path_sink_wrapper() -> None:
    """Comparison case."""
    run_path_sink_wrapper(os.environ.get("INPUT", ""))


if __name__ == "__main__":
    path_sink_wrapper()
