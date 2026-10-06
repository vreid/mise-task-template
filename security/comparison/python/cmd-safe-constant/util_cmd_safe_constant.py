import os
import subprocess


def run_cmd_safe_constant(value: str) -> None:
    """Comparison case."""
    subprocess.run(value, shell=True, check=False)
