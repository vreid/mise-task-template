import os
import subprocess


def run_cmd_sink_wrapper(value: str) -> None:
    """Comparison case."""
    subprocess.run(value, shell=True, check=False)


def cmd_sink_wrapper() -> None:
    """Comparison case."""
    run_cmd_sink_wrapper(os.environ.get("INPUT", ""))


if __name__ == "__main__":
    cmd_sink_wrapper()
