import os
import subprocess

from util_cmd_source_wrapper_file import read_cmd_source_wrapper_file


def cmd_source_wrapper_file() -> None:
    """Comparison case."""
    subprocess.run(read_cmd_source_wrapper_file(), shell=True, check=False)


if __name__ == "__main__":
    cmd_source_wrapper_file()
