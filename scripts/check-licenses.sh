#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# check:sbom writes this inventory first in the same Task invocation.
# Keep the policy and findings intact while enforcement is temporarily advisory.
printf '%s\n' 'License findings are warnings only for now; review any denied packages below.' >&2
grant check --config .grant.yaml --dry-run reports/sbom.syft.json
grant check --config .grant.yaml --dry-run --no-output \
  --output-file reports/licenses.json reports/sbom.syft.json
