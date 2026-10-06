import os

from util_cmd_safe_constant import run_cmd_safe_constant


def cmd_safe_constant() -> None:
    """Comparison case."""
    run_cmd_safe_constant("ls")


if __name__ == "__main__":
    cmd_safe_constant()
