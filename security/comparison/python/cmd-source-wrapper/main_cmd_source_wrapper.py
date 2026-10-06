import os
import subprocess


def read_cmd_source_wrapper() -> str:
    """Comparison case."""
    return os.environ.get("INPUT", "")


def cmd_source_wrapper() -> None:
    """Comparison case."""
    subprocess.run(read_cmd_source_wrapper(), shell=True, check=False)


if __name__ == "__main__":
    cmd_source_wrapper()
