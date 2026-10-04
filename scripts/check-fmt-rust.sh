#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../examples/rust"

# Parse without writing: rustfmt uses exit code 1 for errors and differences.
cargo fmt --all -- --emit stdout >/dev/null
format_status=0
cargo fmt --all -- --check || format_status=$?
case "$format_status" in
0) ;;
1) echo "Run task fix to apply Rust formatting." ;;
*) exit "$format_status" ;;
esac
