#!/usr/bin/env bash
set -euo pipefail

# Reuse shfmt's shell/shebang detection and EditorConfig exclusions. A temporary
# NUL-delimited list preserves unusual filenames and propagates discovery errors.
file_list=$(mktemp)
trap 'rm -f "$file_list"' EXIT
shfmt -f=0 . >"$file_list"

files=()
while IFS= read -r -d '' file; do
  files+=("$file")
done <"$file_list"

if [[ ${#files[@]} -gt 0 ]]; then
  shellcheck --check-sourced "$@" "${files[@]}"
fi
