import os
import subprocess


def run_cmd_sink_wrapper_file(value: str) -> None:
    """Comparison case."""
    subprocess.run(value, shell=True, check=False)
