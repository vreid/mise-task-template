import os
import subprocess


def read_path_source_wrapper() -> str:
    """Comparison case."""
    return os.environ.get("INPUT", "")


def path_source_wrapper() -> None:
    """Comparison case."""
    with open(read_path_source_wrapper(), encoding="utf-8") as handle:
        print(handle.read())


if __name__ == "__main__":
    path_source_wrapper()
