#!/usr/bin/env bash
set -euo pipefail

mode=${1:?Expected check, verify, write, or fix}
case "$mode" in
check | verify | write | fix) ;;
*)
  echo "Unknown formatting mode: $mode" >&2
  exit 2
  ;;
esac

cd "$(dirname "$0")/.."

run_formatter() {
  local format_output
  local format_status=0
  # dotnet format can return 0 after skipping a project it could not load.
  # Keep its diagnostic language stable so this partial result fails closed.
  format_output=$(DOTNET_CLI_UI_LANGUAGE=en-US dotnet format "$@" --no-restore 2>&1) || format_status=$?
  if [ -n "$format_output" ]; then
    printf '%s\n' "$format_output"
  fi
  case "$format_output" in
  *"Warnings were encountered while loading the workspace"*)
    echo "C# formatting could not load the complete workspace; run task check:csharp for details." >&2
    return 1
    ;;
  esac
  return "$format_status"
}

# Include the application and the separate test project explicitly.
for project in examples/csharp/src/WordCount.csproj examples/csharp/tests/WordCount.Tests.csproj; do
  if [ "$mode" = fix ]; then
    run_formatter "$project" --severity warn
  elif [ "$mode" = write ]; then
    run_formatter whitespace "$project"
  else
    format_status=0
    run_formatter whitespace "$project" --verify-no-changes || format_status=$?
    # dotnet format reserves exit code 2 for changes needed by the formatter.
    if [ "$mode" = check ] && [ "$format_status" -eq 2 ]; then
      echo "Run task fix to apply C# formatting."
    elif [ "$format_status" -ne 0 ]; then
      exit "$format_status"
    fi
  fi
done
