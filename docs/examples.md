# Language examples

Each directory under `examples/` implements the same small word-count library
and CLI. There are no dependencies between the examples or third-party
application packages. Shared infrastructure lives at the repository root;
copying only an example directory does not include that infrastructure.

## Behavior

A word is a nonempty run separated by ASCII whitespace: space, tab, newline,
carriage return, vertical tab, or form feed. Punctuation and non-ASCII
whitespace remain part of a word. This deliberately small contract has the same
meaning in every language, without locale-dependent splitting.

Each CLI takes exactly one text argument and prints the count followed by a
newline. Empty text produces `0`. Missing or additional arguments print
`Usage: word-count TEXT` to stderr and return exit code `2`.

```bash
mise exec -- task run:typescript TEXT="one two three"
mise exec -- task run:python TEXT=""
mise exec -- task run TEXT="hello world"
```

`TEXT` is passed through an environment variable and a quoted shell argument.
Quotes and shell characters in the supplied text are data. Without `TEXT`, run
tasks use `hello world`. A command-line argument cannot contain a NUL byte.

## Builds and tests

| Example    | Build or execution                   | Test runner                     |
| ---------- | ------------------------------------ | ------------------------------- |
| TypeScript | Node's native TypeScript support     | `node --test`                   |
| C#         | `dotnet build`, targeting .NET 10    | Small console test project      |
| C          | Clang with C17                       | Test executable with ASan/UBSan |
| C++        | Clang++ with C++20                   | Test executable with ASan/UBSan |
| Go         | `go build`                           | `go test`                       |
| Rust       | `cargo build --locked`, edition 2024 | `cargo test --locked`           |
| Python     | Python interpreter                   | Standard-library `doctest`      |

The same seven cases cover empty text, whitespace-only input, one word, repeated
and mixed separators, punctuation, and a non-breaking space. C, C++, and C# test
executables return nonzero on a failed comparison; they do not depend on
assertions that release builds could remove. Native test frameworks can be
chosen later if these examples grow.

`task build` only builds examples that need compilation. `task test` builds its
test executables as needed. `task run:<language>` builds the selected CLI when
needed. C, C++, and Go outputs live in root `build/`; .NET uses its project
`bin/` and `obj/` directories, and Cargo uses `examples/rust/target/`. Generated
outputs and Python bytecode are ignored by Git. Native commands can also be run
inside their example directories with `mise exec --`.

`task setup` restores the pnpm workspace, both .NET projects, and Cargo from
their committed locks. Go has no external modules, so it needs no `go.sum` yet.
The Python example has no dependencies or virtual environment. New application
dependencies must be accompanied by the appropriate restore and update tasks.

## Version ownership

mise reads native version files through `idiomatic_version_file_enable_tools`.
They live at the root so selection works from the root and every example:

| Tool                                 | Version source                                                  |
| ------------------------------------ | --------------------------------------------------------------- |
| Node and pnpm                        | Root `package.json` `devEngines`                                |
| Task                                 | Root `Taskfile.yml`                                             |
| .NET SDK                             | Root `global.json`, exact version                               |
| Go                                   | Root `.go-version`, latest Go 1 release locked by mise          |
| Python                               | Root `.python-version`, latest Python 3 release locked by mise  |
| Rust                                 | Root `rust-toolchain.toml`, exact version, Clippy, and rustfmt  |
| golangci-lint                        | Root `.golangci.yml` schema major, exact version in `mise.lock` |
| LLVM/Clang and shared analysis tools | Root `mise.toml` and `mise.lock`                                |

Go's `go.mod` declares the module's minimum language version. It does not
override the root tool selection; Task sets `GOTOOLCHAIN=local` so Go does not
silently download another compiler. Other runtime environment settings also stay
in the Taskfile.

The current mise backends delegate .NET and Rust installation to their native
installers and do not record platform download checksums for them in
`mise.lock`. Exact native version pins keep their version selection repeatable.
Using a floating Rust `stable` channel would not provide that property.

`task maintenance:runtimes` queries mise for the latest stable .NET and Rust
releases within their selected majors, then updates those exact native pins. It
preserves the other native settings. `task tools:update` resolves the tool lock
and installs the selections. Full `task maintenance` runs both in that order and
then restores, fixes, and verifies. Review native version files as well as locks
after updating. Major runtime migrations are explicit changes.

## Analysis coverage

`task check:lint` aggregates analysis for all seven languages. Oxlint/Oxfmt
cover the TypeScript example and repository configuration files; Ruff covers
Python. Go uses golangci-lint, Rust uses Clippy, and C# uses the SDK's strict
analyzer set and build-time code-style checks. See
[language checks](language-checks.md) for rules, formatting, and automatic
fixes.

Shared shell, Markdown, secret, license, and vulnerability checks still scan the
repository. `task check` keeps formatting advisory; `task verify` enforces it
and includes all builds and tests. The pre-commit hook still runs `check`.

C and C++ enable `-Weverything` with language-compatibility exceptions and use
clang-tidy. Builds keep compiler warnings advisory; `verify` enforces a frozen
diagnostic policy so new diagnostic IDs remain advisory after tool upgrades.
clang-format uses the LLVM baseline, and unit tests run with ASan and UBSan. See
[C and C++ checks](c-cpp.md).

Native tool references:
[Node TypeScript support](https://nodejs.org/api/typescript.html),
[mise version files](https://mise.jdx.dev/configuration.html#idiomatic-version-files),
and
[.NET SDK selection](https://learn.microsoft.com/en-us/dotnet/core/tools/global-json).
