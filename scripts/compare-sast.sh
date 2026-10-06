#!/usr/bin/env bash
set -euo pipefail

# Runs the repository's analyzers and CodeQL on the neutral corpus in
# security/comparison and CodeQL on the Opengrep fixtures, then scores them.
# CodeQL is not part of the toolchain: set CODEQL to its CLI. Its license
# permits this for open-source codebases; see docs/sast-comparison.md.
cd "$(dirname "$0")/.."
codeql=${CODEQL:?Set CODEQL to the CodeQL CLI binary}
root=$PWD
out=$root/reports/comparison
raw=$out/raw
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
rm -rf "$out"
mkdir -p "$raw"

# Build files exist only in the copy, so Syft does not inventory the corpus.
corpus=$work/corpus
cp -R security/comparison "$corpus"
node scripts/compare-sast.mts prepare "$corpus"

echo "Opengrep"
for mode in default intrafile; do
  extra=()
  if [ "$mode" = intrafile ]; then
    extra=(--taint-intrafile)
  fi
  opengrep scan --config security/rules --no-rewrite-rule-ids \
    --disable-version-check --quiet ${extra[@]+"${extra[@]}"} \
    --json-output="$raw/opengrep-$mode.json" "$corpus" >/dev/null || true
done

echo "Ruff, gosec, .NET analyzers"
ruff check --config .ruff.toml --select S --output-format json --exit-zero \
  "$corpus/python" >"$raw/ruff.json"
(cd "$corpus/go" && golangci-lint run --config "$root/.golangci.yml" \
  --enable-only gosec --max-issues-per-linter 0 --max-same-issues 0 \
  --issues-exit-code 0 --output.json.path "$raw/gosec.json" ./...)
dotnet build "$corpus/csharp/Comparison.csproj" -p:AnalysisLevel=latest-all \
  -p:TreatWarningsAsErrors=false >"$raw/dotnet.log" || true

echo "Clang static analyzer"
for language in c cpp; do
  for mode in tu ctu; do
    extra=()
    if [ "$mode" = ctu ]; then
      extra=(--ctu)
    fi
    report=$work/clang-$language-$mode
    analyze-build --cdb "$corpus/$language/compile_commands.json" \
      ${extra[@]+"${extra[@]}"} --enable-checker optin.taint.GenericTaint \
      --sarif -o "$report" >/dev/null 2>&1
    cp "$(find "$report" -name results-merged.sarif)" \
      "$raw/clang-$mode-$language.sarif"
  done
done

# Each database is analyzed with CodeQL's default threat model (remote input)
# and with local input such as environment variables and arguments added.
analyze() {
  local database=$1 language=$2 name=$3
  mkdir -p "$(dirname "$raw/$name")"
  for model in default local; do
    extra=()
    if [ "$model" = local ]; then
      extra=(--threat-model=local)
    fi
    "$codeql" database analyze "$database" \
      "codeql/$language-queries:codeql-suites/$language-security-extended.qls" \
      ${extra[@]+"${extra[@]}"} --rerun --format=sarif-latest --threads=0 \
      --output="$raw/$name-$model.sarif" >/dev/null 2>&1
  done
}

# A failed extraction is reported as "not run" instead of stopping.
extract() {
  local database=$1 language=$2 source=$3 name=$4 build=$5
  mkdir -p "$(dirname "$raw/$name")"
  if "$codeql" database create "$database" --language="$language" \
    --source-root="$source" "$build" --overwrite >"$raw/$name.log" 2>&1; then
    analyze "$database" "$language" "$name"
  else
    echo "  CodeQL could not extract $name; see $raw/$name.log"
  fi
}

echo "CodeQL"
for entry in typescript:javascript python:python csharp:csharp rust:rust \
  go:go c:cpp cpp:cpp; do
  directory=${entry%%:*}
  language=${entry##*:}
  if [ "$language" = cpp ]; then
    # One database per case: CodeQL treats a database as one program, and
    # each case defines its own main.
    for script in "$corpus/$directory"/.build/*.sh; do
      name=$(basename "$script" .sh)
      extract "$work/db-$directory-$name" "$language" "$corpus/$directory" \
        "codeql-$directory/$name" --command="bash $script"
    done
  elif [ "$language" = go ]; then
    extract "$work/db-$directory" "$language" "$corpus/$directory" \
      "codeql-$directory" --command="bash $corpus/$directory/build.sh"
  else
    extract "$work/db-$directory" "$language" "$corpus/$directory" \
      "codeql-$directory" --build-mode=none
  fi

  # The Opengrep fixtures are fragments; Go's cannot be built for CodeQL.
  if [ "$directory" != go ]; then
    database=$work/fixtures-$directory
    "$codeql" database create "$database" --language="$language" \
      --source-root="security/tests/$directory" --build-mode=none \
      --overwrite >/dev/null 2>&1
    analyze "$database" "$language" "fixtures-codeql-$directory"
  fi
done

{
  echo "codeql=$("$codeql" version --format=terse)"
  echo "opengrep=$(opengrep --version)"
  echo "clang=$(clang --version | head -n 1)"
  echo "ruff=$(ruff --version)"
  echo "golangci-lint=$(golangci-lint version --short)"
  echo "dotnet=$(dotnet --version)"
} >"$raw/versions.txt"

node scripts/compare-sast.mts score "$out"
