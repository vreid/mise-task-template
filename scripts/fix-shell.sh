#!/usr/bin/env bash
set -euo pipefail

patch_file=$(mktemp)
trap 'rm -f "$patch_file"' EXIT

lint_status=0
bash scripts/shellcheck.sh --format=diff >"$patch_file" || lint_status=$?
case "$lint_status" in
0 | 1) ;;
*) exit "$lint_status" ;;
esac

if [[ -s "$patch_file" ]]; then
  # ShellCheck preserves ./ prefixes in sourced-file paths; git apply rejects
  # those prefixes but correctly handles filenames containing spaces.
  sed -e 's|^--- a/\./|--- a/|' -e 's|^+++ b/\./|+++ b/|' "$patch_file" | git apply
fi

# Some diagnostics have no automatic fix. Report and fail on anything remaining.
bash scripts/shellcheck.sh
