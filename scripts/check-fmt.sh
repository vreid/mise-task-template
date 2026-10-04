#!/usr/bin/env bash
set -euo pipefail

format_status=0
format_output=$(pnpm exec oxfmt --check .) || format_status=$?
printf '%s\n' "$format_output"

# Oxfmt also uses exit code 1 for configuration errors.
# Only its completed formatting-difference report is advisory.
case "$format_status:$format_output" in
1:*"Format issues found in above "*) echo "Run task fix to apply formatting." ;;
*) exit "$format_status" ;;
esac
