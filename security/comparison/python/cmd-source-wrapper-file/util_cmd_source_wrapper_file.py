import os


def read_cmd_source_wrapper_file() -> str:
    """Comparison case."""
    return os.environ.get("INPUT", "")
