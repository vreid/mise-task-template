#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p reports

# Release tooling can supply its own name and version label. Otherwise use the
# checkout directory and describe the analyzed commit, marking local changes.
name=${REPORT_NAME:-$(basename "$(git rev-parse --show-toplevel)")}
version=${REPORT_VERSION:-$(git describe --tags --always --dirty)}

# One scan writes every format, so the reported inventory is the gated one.
# Relative output paths avoid MSYS path conversion on native Windows.
syft scan dir:. --config .syft.yaml \
  --source-name "$name" --source-version "$version" \
  -o syft-json=reports/sbom.syft.json \
  -o cyclonedx-json=reports/sbom.cdx.json \
  -o spdx-json=reports/sbom.spdx.json
echo "SBOMs for $name $version: reports/sbom.cdx.json, reports/sbom.spdx.json"
