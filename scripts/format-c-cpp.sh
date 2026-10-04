#!/usr/bin/env bash
set -euo pipefail

mode=${1:?Expected check, verify, or write}
case "$mode" in
check | verify | write) ;;
*)
  echo "Unknown formatting mode: $mode" >&2
  exit 2
  ;;
esac

cd "$(dirname "$0")/.."
work_dir=$(mktemp -d)
trap 'rm -rf "$work_dir"' EXIT
# Include untracked files, respect Git ignores, and preserve unusual filenames.
git ls-files --cached --others --exclude-standard -z -- \
  '*.c' '*.h' '*.cc' '*.hh' '*.cpp' '*.hpp' '*.cxx' '*.hxx' '*.ipp' '*.inl' \
  >"$work_dir/files"

status=0
while IFS= read -r -d '' file; do
  [ -f "$file" ] || continue
  if [ "$mode" = write ]; then
    clang-format --style=file:.clang-format --fail-on-incomplete-format -i "./$file"
  else
    # Compare formatted output instead of swallowing clang-format's exit code:
    # bad config and incomplete formatting must fail even in advisory mode.
    clang-format --style=file:.clang-format --fail-on-incomplete-format \
      "./$file" >"$work_dir/formatted"
    comparison=0
    cmp -s "$file" "$work_dir/formatted" || comparison=$?
    case "$comparison" in
    0) ;;
    1)
      echo "Needs C/C++ formatting: $file"
      status=1
      ;;
    *) exit "$comparison" ;;
    esac
  fi
done <"$work_dir/files"

if [ "$mode" = check ] && [ "$status" -eq 1 ]; then
  echo "Run task fmt:c-cpp to apply LLVM-style formatting."
else
  exit "$status"
fi
