import os
import subprocess


def cmd_direct() -> None:
    """Comparison case."""
    value = os.environ.get("INPUT", "")
    subprocess.run(value, shell=True, check=False)


if __name__ == "__main__":
    cmd_direct()
