#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p reports

# The analyzed commit identifies every report, independent of any release
# version scheme; mise.lock and the lockfiles at that commit pin the tools.
commit=$(git rev-parse HEAD)
dirty=false
if [ -n "$(git status --porcelain)" ]; then
  dirty=true
fi
printf '{\n  "commit": "%s",\n  "dirty": %s,\n  "generated": "%s",\n  "platform": "%s-%s"\n}\n' \
  "$commit" "$dirty" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "$(uname -s | tr '[:upper:]' '[:lower:]')" "$(uname -m)" >reports/manifest.json
echo "Reports describe commit $commit (uncommitted changes: $dirty)."
