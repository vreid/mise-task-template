# Copyright 2026 mise-task-template contributors.
"""Run Lizard against Git's file list, including TypeScript module suffixes."""

import os
import sys
from pathlib import Path

import lizard
from lizard_languages import TypeScriptReader, get_reader_for

# Lizard 1.24's TypeScript reader only registers .ts; reuse that same parser.
TypeScriptReader.ext = list(
    dict.fromkeys([*TypeScriptReader.ext, "mts", "cts"])
)

files = [
    f"./{name}"
    for name in os.fsdecode(sys.stdin.buffer.read()).split("\0")
    if name
    and Path(name).is_file()
    and not Path(name).is_symlink()
    and get_reader_for(name) is not None
]
if not files:
    sys.exit("No supported source files found for Lizard.")

# Explicit paths keep original names/line numbers and avoid walking ignored
# dependency trees. They also prevent Lizard from deduplicating copied files.
sys.exit(lizard.main([*sys.argv, *files]))
