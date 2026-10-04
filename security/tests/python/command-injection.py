# Copyright 2026 mise-task-template contributors.
"""Opengrep fixtures: parsed as source, never executed."""

import os
import subprocess


def vulnerable() -> None:
    """Demonstrate environment input flowing into shell syntax."""
    value = os.getenv("DEMO_INPUT", "")
    command = "/usr/bin/printf '%s\\n' " + value
    # ruleid: poc.python.environment-to-shell
    subprocess.run(command, shell=True, check=True)


def safe_arguments() -> None:
    """Pass input as data to a fixed executable without a shell."""
    value = os.getenv("DEMO_INPUT", "")
    # ok: poc.python.environment-to-shell
    subprocess.run(["/usr/bin/printf", "%s\n", value], check=True)


def constant_command() -> None:
    """Keep the entire command independent of external input."""
    # ok: poc.python.environment-to-shell
    subprocess.run("/usr/bin/printf '%s\\n' fixed", shell=True, check=True)
