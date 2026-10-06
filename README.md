# mise + Task template

A shared development setup with matching word-count examples in TypeScript, C#,
C, C++, Go, Rust, and Python. mise manages tools; Task provides the commands.

## Getting started

Install mise, then run from the repository root:

```bash
mise trust
mise install --locked
mise exec -- task setup
mise exec -- task verify
mise exec -- task run TEXT="one two three"
```

With mise activated in your shell, use `task` directly. The default task lists
available commands. The tool lock targets Linux x64, Windows x64, and macOS
ARM64. macOS needs Xcode or the Command Line Tools; Linux needs the system C/C++
headers and linker; native Windows needs Git for Windows' Bash on PATH and
Visual Studio C++ Build Tools with the Windows SDK. The selected GitHub runners
provide these prerequisites. Grant has no Windows release, so Windows reports
the unavailable license check explicitly; Linux and macOS run it.

In VS Code, run `mise exec -- task setup:ide`, open the folder with
`mise exec -- code .`, and install the recommended extensions. They show lint,
type, and analyzer diagnostics from the pinned tools while you edit. **Tasks:
Run Task** → **task check** runs the full analysis and lists located findings in
the Problems panel. See [VS Code](docs/vscode.md).

GitHub Actions runs the [workflow](.github/workflows/verify.yml) on pull
requests, pushes to `main`, and manual dispatch. Its Linux, native Windows, and
macOS jobs check out full history, install locked tools through mise, then run
`task verify` and compare the findings with an available baseline artifact. That
task first restores locked dependencies before building, checking, and testing.
Make all three `verify` matrix checks required in the repository's branch rules
to block merging when verification fails.

`check` and `verify` write SBOMs, per-function complexity metrics, and the
register of inline suppressions to the ignored `reports/` folder. CI keeps the
artifacts for three days, the accepted PoC retention. Each run records check
completion, diagnostic logs, and artifact hashes; see
[analysis reports](docs/reports.md).

`task check:actions` runs [actionlint](https://github.com/rhysd/actionlint),
including its ShellCheck integration. Both `check` and `verify` include it;
Oxfmt formats the workflow YAML. `task maintenance:actions` uses
[actions-up](https://github.com/azat-io/actions-up) to update action references
and their commit SHA pins, and is included in `maintenance`.
`task check:actions:updates` previews updates on demand without editing files.

## Commands

| Command                              | Purpose                                                                         |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `task setup`                         | Restore selected tools, locked dependencies, and Git hooks.                     |
| `task build`                         | Build the C, C++, C#, Go, and Rust examples.                                    |
| `task test`                          | Run tests for all seven examples.                                               |
| `task run:rust TEXT="one two three"` | Run one example; prints `3`.                                                    |
| `task check`                         | Analyze the repository and write reports; formatting and licenses are advisory. |
| `task check:new`                     | Baseline demo: fail only on findings added since the merge base with `BASE`.    |
| `task verify`                        | Restore locked dependencies, build, analyze, enforce formatting, and test.      |
| `task fix`                           | Apply supported formatting and lint fixes.                                      |
| `task maintenance`                   | Update selected tool versions and npm dependencies, restore, fix, and verify.   |

Language-specific build, test, and run tasks use the directory names below as
suffixes, such as `test:typescript` and `build:cpp`. TypeScript runs directly in
Node and Python runs directly in its interpreter, so neither has a build task.

## Layout

```text
examples/
  typescript/  # Node, with the built-in test runner
  csharp/      # .NET projects and a small test executable
  c/           # Clang and a small test executable
  cpp/         # Clang++ and a small test executable
  go/          # Go module and go test
  rust/        # Cargo package and cargo test
  python/      # Standalone script and doctest
tasks/         # One shared Taskfile per verb
scripts/       # Helpers for longer operations
security/      # Opengrep rules and unexecuted security regression fixtures
docs/          # Behavior and policy details
reports/       # Generated SBOMs, metrics, and suppression register (ignored)
```

Each example owns its code and project files. The root owns tool selection, task
orchestration, hooks, and shared policies. Details:
[examples and tool versions](docs/examples.md), [Python checks](docs/python.md),
[language checks](docs/language-checks.md), [C/C++ checks](docs/c-cpp.md),
[security checks](docs/security.md), [source security rules](docs/sast.md), and
[OWASP and CWE coverage](docs/owasp-cwe-coverage.md). Repository size and
maintainability checks are described in [code metrics](docs/code-metrics.md).
Generated outputs are described in [analysis reports](docs/reports.md), and the
rules for inline exceptions in [suppressions](docs/suppressions.md). Why the
next security budget should go to an AI coding harness rather than GHAS is
argued in [security spend](docs/security-spend.md).

The [requirements handover](docs/requirements-handover.md) records the agreed
PoC scope, requirement coverage, remaining work, and validation evidence for an
independent review. The [requirements matrix](docs/requirements-matrix.md)
translates each workshop requirement and lists the tools that cover it.
