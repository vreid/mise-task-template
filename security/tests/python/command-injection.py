# Copyright 2026 mise-task-template contributors.
"""Opengrep fixtures: parsed as source, never executed."""

import os
import subprocess
import sys


def vulnerable() -> None:
    """Demonstrate environment input flowing into shell syntax."""
    value = os.getenv("DEMO_INPUT", "")
    command = "/usr/bin/printf '%s\\n' " + value
    # ruleid: poc.python.input-to-shell
    subprocess.run(command, shell=True, check=True)


def safe_arguments() -> None:
    """Pass input as data to a fixed executable without a shell."""
    value = os.getenv("DEMO_INPUT", "")
    # ok: poc.python.input-to-shell
    subprocess.run(["/usr/bin/printf", "%s\n", value], check=True)


def constant_command() -> None:
    """Keep the entire command independent of external input."""
    # ok: poc.python.input-to-shell
    subprocess.run("/usr/bin/printf '%s\\n' fixed", shell=True, check=True)


def via_popen() -> None:
    """Start a shell through Popen."""
    # ruleid: poc.python.input-to-shell
    subprocess.Popen(os.getenv("DEMO_INPUT", ""), shell=True).wait()


def via_os_popen() -> None:
    """Start a shell through os.popen."""
    # ruleid: poc.python.input-to-shell
    os.popen(os.environ["DEMO_INPUT"]).close()


def via_arguments() -> None:
    """Pass a command-line argument to a shell."""
    # ruleid: poc.python.input-to-shell
    subprocess.run(sys.argv[1], shell=True, check=True)


def safe_arguments_from_argv() -> None:
    """Pass a command-line argument as data, without a shell."""
    # ok: poc.python.input-to-shell
    subprocess.run(["/usr/bin/printf", "%s\n", sys.argv[1]], check=True)
