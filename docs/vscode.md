# VS Code

The workspace files in `.vscode/` connect editor extensions to the pinned tools
and checked-in configurations that `task check` uses, so diagnostics appear
while editing instead of only at commit time. They are workspace settings only:
nothing is written to user settings, and no extension is installed
automatically. VS Code offers the recommended extensions when the folder opens.

## Opening the repository

Start VS Code with the pinned tools on PATH, and generate the C/C++ compile
database once (again after changing `scripts/c-cpp.sh`):

```bash
mise exec -- task setup:ide
mise exec -- code .
```

`mise exec` supplies the exact Ruff, gopls, golangci-lint, clangd, Clippy, .NET
SDK, and ShellCheck versions from `mise.lock`. With mise activated in the shell,
`code .` from the repository is equivalent. Launched from the Dock instead, VS
Code may find other versions or none.

## Live diagnostics

| Language   | Extension                               | Runs                                                                |
| ---------- | --------------------------------------- | ------------------------------------------------------------------- |
| Python     | `charliermarsh.ruff`                    | Pinned Ruff with `.ruff.toml`, not the bundled copy                 |
| TypeScript | `oxc.oxc-vscode`                        | Oxlint from `node_modules` with `oxlint.config.mts`                 |
| Rust       | `rust-lang.rust-analyzer`               | Clippy on all targets and features with the `Cargo.toml` lints      |
| Go         | `golang.go`                             | Pinned gopls; on save, pinned golangci-lint with `.golangci.yml`    |
| C, C++     | `llvm-vs-code-extensions.vscode-clangd` | Pinned clangd with the task flags, plus `.clang-tidy`               |
| C#         | `ms-dotnettools.csharp`                 | SDK analyzers configured in `Directory.Build.props`, for open files |
| Shell      | `timonwong.shellcheck`                  | ShellCheck with `.shellcheckrc`                                     |
| Markdown   | `DavidAnson.vscode-markdownlint`        | markdownlint with `.markdownlint-cli2.mjs`                          |

The Microsoft C/C++ extension is marked unwanted and its IntelliSense disabled,
so it cannot report diagnostics that contradict clangd. The Go extension is
pointed at golangci-lint on PATH; by default it would install its own unpinned
copy. gopls is pinned in `mise.toml` for the same reason.

C# analyzers run on open files only. Whole-solution analysis would also list the
deliberately unsafe fixtures in `security/linter-tests` as permanent errors.

Opengrep, Betterleaks, Lizard, the suppression register, and vulnerability and
license checks have no live editor integration. They run in the task below.

## Problems from `task check`

**Tasks: Run Task** offers **task check** and **task setup:ide**. The check
task's problem matchers put these results in the Problems panel:

- Clang and clang-tidy warnings and errors;
- golangci-lint and MSBuild diagnostics;
- Lizard limit violations;
- open Opengrep, Betterleaks, and suppression-register findings, which the
  findings summary prints as `path:line: level: tool rule` (high is an error,
  medium a warning, low information).

Other linter output stays in the task terminal; their extensions show the same
diagnostics live.

## Validation

This setup was tested in VS Code 1.140 on macOS with an isolated profile. A test
extension saved one defect per language and read the editor's diagnostics. All
eight extensions reported them from the pinned tools, for example Clippy
`unwrap_used`, clang-tidy `cppcoreguidelines-init-variables`, Clang
`-Wmissing-prototypes` from `-Weverything`, golangci-lint's `gocritic`, and the
analyzer rule `IDE0008`. Running **task check** in the same way produced
Problems entries for every matcher above. Windows and Linux editors have not
been tested.
