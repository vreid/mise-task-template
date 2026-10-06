import os
import subprocess


def cmd_safe_api() -> None:
    """Comparison case."""
    value = os.environ.get("INPUT", "")
    subprocess.run(["/usr/bin/printf", "%s\n", value], check=False)


if __name__ == "__main__":
    cmd_safe_api()
