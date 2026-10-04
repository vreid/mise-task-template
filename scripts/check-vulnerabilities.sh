#!/usr/bin/env bash
set -euo pipefail

# Use the same full-repository catalog as the license check, with no stale SBOM.
sbom=$(mktemp)
trap 'rm -f "$sbom"' EXIT

# Shell redirection and stdin avoid MSYS path conversion inside tool-specific
# arguments such as syft-json=/tmp/... and sbom:/tmp/... on native Windows.
syft scan dir:. --config .syft.yaml -o syft-json >"$sbom"
grype --config .grype.yaml <"$sbom"
