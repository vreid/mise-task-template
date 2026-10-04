#!/usr/bin/env bash
set -euo pipefail

for iteration in 1 2 3 4 5; do
  printf 'Formatting pass %s/5\n' "$iteration"
  pnpm exec oxfmt --write . || exit "$?"
  format_status=0
  pnpm exec oxfmt --check . || format_status=$?
  case "$format_status" in
  0) exit 0 ;;
  1) ;;
  *) exit "$format_status" ;;
  esac
done

echo "Formatting did not stabilize after five passes." >&2
exit 1
