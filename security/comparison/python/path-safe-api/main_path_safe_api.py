import os
import subprocess


def path_safe_api() -> None:
    """Comparison case."""
    value = os.environ.get("INPUT", "")
    if value in {"a.txt", "b.txt"}:
        with open(value, encoding="utf-8") as handle:
            print(handle.read())


if __name__ == "__main__":
    path_safe_api()
