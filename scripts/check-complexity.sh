#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Lizard lives in mise's isolated virtual environment, not in the example's
# Python environment. Its launcher is a symlink into that environment on Unix
# but a standalone copy on Windows, so find the environment beside it.
shopt -s dotglob nullglob
install_dir=$(dirname "$(dirname "$(command -v lizard)")")
configs=()
for config in "$install_dir"/{,*/,*/*/}pyvenv.cfg; do
  if [ -f "$config" ]; then
    configs+=("$config")
  fi
done
shopt -u dotglob nullglob
if [ "${#configs[@]}" -ne 1 ]; then
  echo "Expected one Lizard virtual environment in $install_dir" >&2
  exit 1
fi
environment=$(dirname "${configs[0]}")
lizard_python=$environment/bin/python
if [ ! -x "$lizard_python" ]; then
  lizard_python=$environment/Scripts/python.exe
fi

# Git handles nested ignores, dependencies, and build outputs. NUL separation
# preserves filenames, and the adapter selects every language Lizard supports.
file_list=$(mktemp)
trap 'rm -f "$file_list"' EXIT
git ls-files --cached --others --exclude-standard -z >"$file_list"

# Include top-level code so moving logic outside a function cannot hide it.
lizard=("$lizard_python" scripts/check-complexity.py --extension outside)
report=reports/complexity.csv

# Record every function's metrics first, so the report exists even on failure.
mkdir -p reports
"${lizard[@]}" --csv --verbose --output_file "$report" <"$file_list"

# Then fail when a function or top-level code exceeds a limit.
"${lizard[@]}" --CCN 10 --Threshold nloc=60 --arguments 5 --length 1000 \
  --ignore_warnings 0 --warnings_only <"$file_list"

# Column 2 is CCN; the header row precedes one row per function.
summary=$(awk -F, 'NR > 1 { n++; if ($2 > max) max = $2 }
  END { printf "%d functions, highest CCN %d", n, max }' "$report")
echo "Lizard: limits passed ($summary); per-function metrics in $report."
