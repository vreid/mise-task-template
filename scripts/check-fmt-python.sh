#!/usr/bin/env bash
set -euo pipefail

format_status=0
ruff format --config .ruff.toml --check . || format_status=$?

# Ruff distinguishes formatting differences (1) from syntax/config errors (2).
case "$format_status" in
0) ;;
1) echo "Run task fix to apply Python formatting." ;;
*) exit "$format_status" ;;
esac
