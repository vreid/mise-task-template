#!/usr/bin/env bash
set -euo pipefail

# Baseline demonstration: fail only on findings that the commits since the
# merge base with CHECK_BASE introduce. Findings already present at the merge
# base are tolerated. Only tools with a native new-findings mode take part;
# see docs/baseline.md for what a project would have to decide itself.
cd "$(dirname "$0")/.."
target=${CHECK_BASE:?Expected CHECK_BASE, for example origin/main}
base=$(git merge-base "$target" HEAD)
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  # Opengrep compares commits; uncommitted edits would belong to neither.
  echo "Commit or stash tracked changes before comparing with $target." >&2
  exit 2
fi
echo "Reporting findings introduced since $(git rev-parse --short "$base") ($target)."

output=reports/new
mkdir -p "$output"
status=0

flags=(--no-rewrite-rule-ids --disable-version-check --strict --error
  --baseline-commit "$base")
opengrep scan "${flags[@]}" --json-output="$output/sast.json" \
  --config security/rules --exclude security/tests \
  --exclude security/linter-tests . || status=1

if [ -f examples/go/go.mod ]; then
  (cd examples/go && golangci-lint run --config ../../.golangci.yml \
    --new-from-merge-base "$target" ./...) || status=1
fi

betterleaks git . --log-opts="$base..HEAD" --config security/betterleaks.toml \
  --redact=100 --validation=false --no-banner --ignore-gitleaks-allow \
  --report-format json --report-path "$output/secrets.json" || status=1

exit "$status"
