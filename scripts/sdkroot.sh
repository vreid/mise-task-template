#!/usr/bin/env bash
set -euo pipefail

# Preserve an explicit SDK; otherwise use Xcode or the Command Line Tools on macOS.
if [ -n "${SDKROOT:-}" ]; then
  printf '%s' "$SDKROOT"
elif [ "$(uname -s)" = 'Darwin' ]; then
  xcrun --show-sdk-path
fi
