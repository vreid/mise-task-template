import os
import subprocess

from util_path_source_wrapper_file import read_path_source_wrapper_file


def path_source_wrapper_file() -> None:
    """Comparison case."""
    with open(read_path_source_wrapper_file(), encoding="utf-8") as handle:
        print(handle.read())


if __name__ == "__main__":
    path_source_wrapper_file()
