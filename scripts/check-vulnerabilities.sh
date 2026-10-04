#!/usr/bin/env bash
set -euo pipefail

# Use the same full-repository catalog as the license check, with no stale SBOM.
sbom=$(mktemp)
trap 'rm -f "$sbom"' EXIT

syft scan dir:. --config .syft.yaml -o "syft-json=$sbom"
grype "sbom:$sbom" --config .grype.yaml
