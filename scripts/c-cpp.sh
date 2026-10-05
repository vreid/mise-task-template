#!/usr/bin/env bash
set -euo pipefail

mode=${1:?Expected build, test, check, verify, fix, or compdb}
language=${2:?Expected c or cpp}
cd "$(dirname "$0")/.."

flags=(-g -O1 -Weverything)
case "$language" in
c)
  compiler=${CC:-clang}
  extension=c
  # Mixed declarations are standard in C17; pre-C99 compatibility is irrelevant.
  flags+=(-std=c17 -Wno-declaration-after-statement)
  ;;
cpp)
  compiler=${CXX:-clang++}
  extension=cpp
  # This project targets C++20, not compatibility with older language modes.
  flags+=(-std=c++20 -Wno-c++98-compat -Wno-c++98-compat-pedantic
    -Wno-pre-c++14-compat -Wno-pre-c++17-compat -Wno-pre-c++20-compat)
  ;;
*)
  echo "Unknown native language: $language" >&2
  exit 2
  ;;
esac

# These small examples have no generated sources or external include paths.
# Share the exact language/compile flags with clang-tidy via its fixed database.
project="examples/$language"
sources=("$project"/src/*."$extension" "$project"/tests/*."$extension")
library=("$project/src/word_count.$extension")
output="build/$language"

case "$mode" in
build)
  mkdir -p "$output"
  "$compiler" "${flags[@]}" "${library[@]}" "$project/src/main.$extension" \
    -o "$output/word-count"
  ;;
test)
  output="$output/sanitized"
  mkdir -p "$output"
  "$compiler" "${flags[@]}" -fno-omit-frame-pointer -fno-optimize-sibling-calls \
    -fsanitize=address,undefined -fsanitize-address-use-after-scope \
    -fsanitize-address-use-after-return=always -fno-sanitize-merge \
    -fno-sanitize-recover=all "${library[@]}" "$project/tests/word_count_test.$extension" \
    -o "$output/word-count-test"
  # LeakSanitizer runs by default on Linux, is opt-in on macOS, and does not
  # exist on Windows, which loads the sanitizer runtime DLL from PATH instead.
  if [ "$(uname -s)" = Darwin ]; then
    export ASAN_OPTIONS=detect_leaks=1
  fi
  if command -v cygpath >/dev/null; then
    PATH="$(cygpath -u "$("$compiler" -print-runtime-dir)"):$PATH"
  fi
  "$output/word-count-test"
  ;;
check)
  "$compiler" "${flags[@]}" -fsyntax-only "${sources[@]}"
  clang-tidy --verify-config
  clang-tidy --quiet "${sources[@]}" -- "${flags[@]}"
  ;;
verify)
  # One translation unit per SARIF document; code generation also finds
  # diagnostics that a syntax-only pass would miss.
  mkdir -p "$output"
  for source in "${sources[@]}"; do
    node scripts/clang-warnings.mts "$compiler" "${flags[@]}" -c "$source" -o "$output/check.o"
  done
  clang-tidy --verify-config
  clang-tidy --quiet "${sources[@]}" -- "${flags[@]}"
  ;;
compdb)
  # clangd does not read SDKROOT from Task's environment, so name the SDK.
  sysroot=()
  if [ -n "${SDKROOT:-}" ]; then
    sysroot=(-isysroot "$SDKROOT")
  fi
  node scripts/compile-commands.mts "$compiler" "${flags[@]}" ${sysroot[@]+"${sysroot[@]}"} \
    -- "${sources[@]}"
  ;;
fix)
  clang-tidy --verify-config
  # Native fix-its are reviewed code changes. Never apply fixes to invalid code.
  clang-tidy --quiet --fix --warnings-as-errors='-*' "${sources[@]}" -- "${flags[@]}"
  ;;
*)
  echo "Unknown C/C++ task mode: $mode" >&2
  exit 2
  ;;
esac
