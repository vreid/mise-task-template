import os
import subprocess


def run_path_safe_constant(value: str) -> None:
    """Comparison case."""
    with open(value, encoding="utf-8") as handle:
        print(handle.read())
