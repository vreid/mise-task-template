#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
flags=(--no-rewrite-rule-ids --disable-version-check --strict --error)

# test:sast checks these deliberately unsafe fixtures separately.
mkdir -p reports
status=0
opengrep scan "${flags[@]}" --json-output=reports/sast.json \
  --config security/rules --exclude security/tests \
  --exclude security/linter-tests . || status=$?

# Opengrep 1.30 directory discovery skips .mts/.cts. Supply these explicitly to
# the TypeScript rules, retaining the original paths in findings.
file_list=$(mktemp)
trap 'rm -f "$file_list"' EXIT
git ls-files --cached --others --exclude-standard -z -- \
  '*.mts' '*.cts' ':(exclude)security/tests/**' >"$file_list"

modules=()
while IFS= read -r -d '' file; do
  if [ -f "$file" ] && [ ! -L "$file" ]; then
    modules+=("./$file")
  fi
done <"$file_list"

if [ "${#modules[@]}" -gt 0 ]; then
  opengrep scan "${flags[@]}" --json-output=reports/sast-modules.json \
    --config security/rules/typescript \
    --scan-unknown-extensions "${modules[@]}" || status=$?
else
  printf '%s\n' '{"results": [], "errors": []}' >reports/sast-modules.json
fi

exit "$status"
