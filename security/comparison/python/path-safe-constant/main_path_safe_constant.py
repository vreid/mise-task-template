import os

from util_path_safe_constant import run_path_safe_constant


def path_safe_constant() -> None:
    """Comparison case."""
    run_path_safe_constant("fixed.txt")


if __name__ == "__main__":
    path_safe_constant()
