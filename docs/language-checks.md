# Language checks

`task check:lint` calls `check:typescript`, `check:go`, `check:rust`,
`check:csharp`, and `check:python`. Every diagnostic from these tasks fails the
gate. Checks analyze complete configured projects, including their tests. Adding
a new Go module, Cargo package, or .NET project requires extending the
corresponding tasks; the current examples are listed explicitly.

`task check:fmt` reports formatting differences without failing on them.
`task verify:fmt` requires consistent formatting. `task fmt` rewrites
formatting; `task fix` also applies supported analyzer fixes and checks for
remaining issues. The full `check`, `verify`, `fix`, pre-commit, and maintenance
flows include the corresponding language tasks.

| Language   | Analysis                                               | Formatting                                  | Automatic fixes                       |
| ---------- | ------------------------------------------------------ | ------------------------------------------- | ------------------------------------- |
| TypeScript | Oxlint, including type-aware lint and type checking    | Oxfmt                                       | Oxlint's safe fixes                   |
| Go         | golangci-lint                                          | gofumpt and goimports through golangci-lint | Enabled linters' code fixes           |
| Rust       | Clippy and compiler checks                             | rustfmt                                     | Machine-applicable Clippy suggestions |
| C#         | .NET SDK analyzers, compiler, and build-time IDE rules | `dotnet format whitespace`                  | SDK style and analyzer code fixes     |
| Python     | Ruff                                                   | Ruff                                        | Ruff's safe fixes                     |

Use scoped tasks such as `task check:rust`, `task fmt:go`, and `task fix:csharp`
for faster feedback. Oxfmt's existing `task fmt:files` covers TypeScript along
with its other supported repository files. `task fix:lint` aggregates language
fixes; `task fix` additionally formats before and after them. Review automatic
fixes: golangci-lint and .NET do not classify suggestions using Ruff's
safe/unsafe distinction.

## Go

`.golangci.yml` enables the standard linters plus an explicit selection for
security, resource handling, error handling, exhaustiveness, correctness,
performance, and style. It enables every govet analyzer, all Staticcheck checks,
and gocritic's diagnostic, performance, and style tags. Error checks include
discarded errors and unchecked type assertions, with the default exclusions
disabled. Suppressions must name a linter and explain why; unused exclusions
produce warnings. There are no blanket test exclusions, default false-positive
presets, or issue-count truncation.

The explicit list avoids implicitly adopting framework-specific rules and
conflicting whitespace policies when new linters are released. Generated files
are recognized only by Go's standard generated-file convention. Checks use
read-only module resolution and fail rather than update dependencies.

mise reads version `2` from `.golangci.yml` through
`idiomatic_version_file_enable_tools`; `mise.lock` pins the selected release.
Setup installs it, and maintenance updates it within that major.

golangci-lint's `run` also checks formatters enabled in its configuration.
Therefore, the configured formatter list is empty and the formatting helper
enables gofumpt and goimports only for `fmt`. This keeps formatting advisory in
`check` while lint findings remain errors. The helper validates syntax and
configuration before distinguishing formatting differences from failures. See
the [golangci-lint commands](https://golangci-lint.run/docs/configuration/cli/).

## Rust

`rust-toolchain.toml` installs Clippy and rustfmt as components of the exact
Rust release. The package's `Cargo.toml` enables Clippy's standard and pedantic
groups, plus checks for `unwrap`, `expect`, debug macros, unfinished code, and
undocumented unsafe blocks. Unsafe code is forbidden; missing documentation and
unused lifetimes or qualifications are diagnosed. All targets and features are
checked with `--locked` and `-D warnings`.

Clippy's entire restriction group is deliberately not enabled: its rules can
conflict with each other and with valid code. Nursery rules remain opt-in. See
the [Clippy rule groups](https://doc.rust-lang.org/clippy/).

`rustfmt.toml` sets an 80-column target, LF endings, and edition 2024. The
advisory helper first parses and formats to stdout without writing files, then
runs the format check. Syntax and tool errors still fail. Clippy fixes allow an
existing dirty or staged worktree, modify working files without staging them,
and run a strict check afterward so unfixable findings remain failures.

## C#

The root `Directory.Build.props` enables the SDK's `latest-all` analyzer set,
build-time code-style analysis, XML documentation generation, and analyzer
warnings as errors. Documentation generation also enables the unnecessary-using
check during builds. The C# example imports the root policy and retains nullable
checking. Future nested `Directory.Build.props` files must import the root file
to retain the shared policy.

`.editorconfig` promotes build-capable IDE style diagnostics to warnings and
selects file-scoped namespaces. Whitespace diagnostic IDE0055 is disabled in
build analysis because whitespace is enforced by the separate formatting gate.
Other style diagnostics, such as unused imports, are lint failures.

`check:csharp` rebuilds the test project and its application reference with
`--no-incremental`, so both projects' analyzers run. `fmt:csharp` only changes
whitespace; `fix:csharp` also applies SDK style and analyzer fixes and then
rechecks both projects. Restore stays explicit through `task deps` or
`task setup`. The formatter wrapper rejects workspace-load warnings because
`dotnet format` can otherwise return success after skipping a broken project.
Compilation catches syntax errors even when Roslyn's whitespace formatter can
recover enough to format malformed code.

`latest-all` is the SDK's supported broad analysis set. Microsoft excludes some
legacy rules and code-metrics rules from that set; it does not literally enable
every historical diagnostic. See the
[SDK analyzer settings](https://learn.microsoft.com/en-us/dotnet/core/project-sdk/msbuild-props#analysismode).
No additional analyzer NuGet package is needed for this configuration.

## TypeScript and Python

The root Oxlint config and strict `tsconfig.json` already include the TypeScript
example's source and tests. Oxfmt formats those files as part of the repository
scan. There is no separate example-specific lint configuration to drift.

Python continues to use the strict `.ruff.toml` policy for repository Python
files, including the example. Ruff enforces lint and annotation rules but does
not perform Python type checking; see [Python checks](python.md).

C/C++ analyzer and formatter selection remains a separate task. Their existing
compiler warnings and tests continue to run in `verify`.
