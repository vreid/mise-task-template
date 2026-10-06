import os
import subprocess


def path_direct() -> None:
    """Comparison case."""
    value = os.environ.get("INPUT", "")
    with open(value, encoding="utf-8") as handle:
        print(handle.read())


if __name__ == "__main__":
    path_direct()
