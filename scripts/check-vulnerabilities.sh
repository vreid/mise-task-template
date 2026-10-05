#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Use the same full-repository inventory as the license check; check:sbom writes
# it first in the same Task invocation. Shell redirection avoids MSYS path
# conversion inside tool-specific arguments such as sbom:/path on Windows.
grype --config .grype.yaml -o table -o template \
  -o json=reports/vulnerabilities.json <reports/sbom.syft.json
