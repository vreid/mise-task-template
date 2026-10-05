#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# A supplied baseline supports offline use; CI can fetch a prior successful run.
if [ -n "${REPORT_BASELINE:-}" ] || [ -z "${REPORT_RUNNER:-}" ]; then
  node scripts/report-trend.mts
  exit "$?"
fi

directory=$(mktemp -d)
trap 'rm -rf "$directory"' EXIT
repo=${GH_REPO:?Expected GH_REPO in CI}
branch=${REPORT_BASE_BRANCH:?Expected REPORT_BASE_BRANCH in CI}
gh api --method GET "repos/$repo/actions/workflows/verify.yml/runs" \
  -f branch="$branch" -f status=success -f per_page=10 \
  --jq '.workflow_runs[] | [.id, .head_sha] | @tsv' >"$directory/runs"

while IFS=$'\t' read -r run commit; do
  if [ "$run" = "${GITHUB_RUN_ID:-}" ]; then
    continue
  fi
  candidate="$directory/$run"
  if gh run download "$run" --repo "$repo" \
    --name "reports-$commit-$REPORT_RUNNER" --dir "$candidate"; then
    # Pre-upgrade artifacts have no completion state and cannot form a baseline.
    if node -e 'const f=require(process.argv[1]); process.exit(f.complete === true ? 0 : 1)' \
      "$candidate/findings.json"; then
      REPORT_BASELINE="$candidate" node scripts/report-trend.mts
      exit "$?"
    fi
  fi
done <"$directory/runs"
node scripts/report-trend.mts
