#!/usr/bin/env bash
set -euo pipefail

# Keep generated inventory outside the scan and remove it even on failure.
sbom=$(mktemp)
trap 'rm -f "$sbom"' EXIT

syft scan dir:. --config .syft.yaml -o "syft-json=$sbom"
# Keep the policy and findings intact while enforcement is temporarily advisory.
printf '%s\n' 'License findings are warnings only for now; review any denied packages below.' >&2
grant check --config .grant.yaml --dry-run "$sbom"
