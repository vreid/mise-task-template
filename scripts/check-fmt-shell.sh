#!/usr/bin/env bash
set -euo pipefail

# Parse first: shfmt uses exit code 1 for both invalid scripts and formatting
# differences. Syntax and execution errors must still fail the advisory check.
shfmt . >/dev/null

format_status=0
shfmt -d . || format_status=$?
case "$format_status" in
0) ;;
1) echo "Run task fix to apply shell formatting." ;;
*) exit "$format_status" ;;
esac
