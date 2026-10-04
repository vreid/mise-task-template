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

cd "$(dirname "$0")/../examples/go"

# Parse first: formatter differences and some tool errors share exit code 1.
# This also catches syntax errors a formatter might log without failing.
gofmt -e -l . >/dev/null
golangci-lint config verify --config ../../.golangci.yml
formatter=(golangci-lint fmt --config ../../.golangci.yml --enable "gofumpt,goimports")
if [ "$mode" = write ]; then
  "${formatter[@]}" .
  exit
fi

format_status=0
"${formatter[@]}" --diff . || format_status=$?
if [ "$mode" = check ] && [ "$format_status" -eq 1 ]; then
  echo "Run task fix to apply Go formatting."
else
  exit "$format_status"
fi
