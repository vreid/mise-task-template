#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Use the interpreter beside the resolved console entry point: Lizard lives in
# mise's isolated virtualenv, not in the example's Python environment.
lizard_python=$(python -c \
  'from pathlib import Path; import sys; print(Path(sys.argv[1]).resolve().with_name("python"))' \
  "$(command -v lizard)")

# Git handles nested ignores, dependencies, and build outputs. NUL separation
# preserves filenames, and the adapter selects every language Lizard supports.
# Include top-level code so moving logic outside a function cannot hide it.
git ls-files --cached --others --exclude-standard -z |
  "$lizard_python" scripts/check-complexity.py \
    --CCN 10 --Threshold nloc=60 --arguments 5 --length 1000 \
    --extension outside \
    --ignore_warnings 0 --warnings_only

echo "Lizard: complexity, function size, and parameter limits passed."
