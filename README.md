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
available commands. The current tool lock targets macOS ARM64; macOS builds
require Xcode or the Command Line Tools for the system SDK. Additional platforms
need their own mise lock entries and validation.

In VS Code, open the repository folder and select **Tasks: Run Task**, then
**task check**. This runs `mise exec -- task check` from the repository root and
shows results in the task terminal. mise must be available on VS Code's PATH.

## Commands

| Command                              | Purpose                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `task setup`                         | Restore selected tools, locked dependencies, and Git hooks.                   |
| `task build`                         | Build the C, C++, C#, Go, and Rust examples.                                  |
| `task test`                          | Run tests for all seven examples.                                             |
| `task run:rust TEXT="one two three"` | Run one example; prints `3`.                                                  |
| `task check`                         | Analyze the repository; formatting and license findings are advisory.         |
| `task verify`                        | Build, analyze, enforce formatting, and test.                                 |
| `task fix`                           | Apply supported formatting and lint fixes.                                    |
| `task maintenance`                   | Update selected tool versions and npm dependencies, restore, fix, and verify. |

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
```

Each example owns its code and project files. The root owns tool selection, task
orchestration, hooks, and shared policies. Details:
[examples and tool versions](docs/examples.md), [Python checks](docs/python.md),
[language checks](docs/language-checks.md), [C/C++ checks](docs/c-cpp.md),
[security checks](docs/security.md), and [source security rules](docs/sast.md).
Repository size and maintainability checks are described in
[code metrics](docs/code-metrics.md).
