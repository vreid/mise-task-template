# Source security proof of concept

Opengrep checks one weakness across TypeScript, C#, C, C++, Go, Rust, and
Python: **OS command injection**, mapped to
[OWASP Top 10:2025 A05 Injection](https://top10.owasp.org/2025/A05_2025-Injection/)
and **CWE-78**, ranked ninth in the
[2025 CWE Top 25](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html).
This demonstrates a tested security rule for every example language; it does not
establish coverage of the entire OWASP Top 10 or CWE Top 25. The
[coverage matrix](owasp-cwe-coverage.md) shows what each category relies on.

## Tasks

| Task              | Behavior                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `task check:sast` | Test the rules, then fail on matching repository vulnerabilities. |
| `task test:sast`  | Check the positive and negative fixtures without executing them.  |

Both `task check` and `task verify` include `check:sast`, so the pre-commit
hook, VS Code task, and maintenance use it too. `task test` includes the rule
tests. Within one Task invocation they run only once. Opengrep findings and
analysis errors fail the check; formatting remains governed by the existing
formatting tasks.

mise installs Opengrep through its registry entry, with the exact release and
checksum in `mise.lock`. It has no idiomatic version file here. Normal setup
restores the pin; maintenance updates it. `task doctor` prints its version.

Only the checked-in rules under `security/rules` are loaded. No remote rule
registry is selected, and the version check is disabled. `.semgrepignore`
replaces Opengrep's built-in exclusions so ordinary application tests remain in
scope. Git ignores still exclude dependencies and build outputs.

Opengrep 1.30 does not discover `.mts` or `.cts` during directory scans. The
small `scripts/check-sast.sh` helper also supplies Git-selected TypeScript
module files explicitly to `security/rules/typescript`, preserving their
original paths in findings. Keep future TypeScript rules in that directory too.

## What the rules model

Each rule uses taint analysis: environment variables and command-line arguments
are treated as untrusted, followed through local assignments and expressions,
and reported when used as shell command text. A shell is any of `sh`, `bash`,
`dash`, `zsh`, `ksh`, `cmd`, or PowerShell, with or without a `/bin/` or
`/usr/bin/` path. `DEMO_INPUT` is the example environment variable; the rules
match any name.

| Language   | Sources                                                            | Shell sinks                                                                              |
| ---------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| TypeScript | `process.env[key]`, `process.env.KEY`, `process.argv`              | `exec`, `execSync`; `spawn`/`spawnSync` with `shell: true`; a shell given `[..., input]` |
| C#         | `Environment.GetEnvironmentVariable`, `GetCommandLineArgs`, `args` | `Process.Start(shell, input)`, `new ProcessStartInfo(shell, input)`                      |
| C          | `getenv`, `argv[i]`                                                | `system`, `popen`, `execl`/`execlp` of a shell                                           |
| C++        | `getenv`, `std::getenv`, `argv[i]`                                 | `system`, `std::system`, `popen`, `execl`/`execlp` of a shell                            |
| Go         | `os.Getenv`, `os.Args`                                             | `exec.Command`/`exec.CommandContext` of a shell                                          |
| Rust       | `std::env::var`, `var_os`, `args`, `args_os`                       | `Command::new(shell)` with chained `.arg` or an `.args` array                            |
| Python     | `os.getenv`, `os.environ` lookups, `sys.argv`                      | `os.system`, `os.popen`, any `subprocess` call with `shell=True`                         |

The C# and C/C++ argument sources match the conventional names `args` and
`argv`, so code using other names for them is not covered.

Findings have Opengrep severity `HIGH`, impact `HIGH`, and CWE/OWASP metadata,
and are written to `reports/sast.json`. Messages explain the intended
remediation: select a fixed executable and pass input as separate arguments
without a shell. The safe fixtures use a fixed `printf` executable and a fixed
format string, keeping input in a data argument. This does not make arbitrary
executables, options, or format strings safe.

The fixtures include the 14 variants an adversarial review used to bypass the
earlier, environment-only rules; all are now caught. HTTP input, files, stdin,
custom wrappers, cross-file flows, and sanitizers are still not modeled.
Existing application code and any future projects need rules for their actual
trust boundaries and APIs. Absence of a finding is not evidence that arbitrary
code is safe.

## Fixtures and rule maintenance

`security/tests` mirrors the language directories in `security/rules`, with
fixtures paired by basename with each YAML rule. Every language has an expected
unsafe flow (`ruleid:`), a safe argument list (`ok:`), and a constant shell
command (`ok:`). TypeScript additionally tests import aliases, namespace
imports, an unrelated API with the same method name, and an `.mts` file. These
are source fixtures, not runnable demonstrations: no task compiles or executes
them.

The native `opengrep scan --test` runner verifies expected findings and rejects
unexpected ones. Only the normal repository scan excludes this fixture
directory. There are no blanket exclusions for application tests. Ruff has
narrow exceptions for the Python fixture's deliberate subprocess examples and
native test annotations; its other checks and formatting remain enabled. The
TypeScript fixtures also remain in the existing lint/type-check scope. C, C++,
C#, Go, and Rust fixtures live outside the application projects.

To inspect the intentional findings directly, run:

```bash
mise exec -- opengrep scan --config security/rules security/tests \
  --no-rewrite-rule-ids --disable-version-check --strict --error
```

This command intentionally exits with status 1. `task test:sast` additionally
includes module suffixes and succeeds when the expected findings and negative
examples match. Change a source, sink, or safe alternative only alongside its
regression fixtures, and rerun the tests when maintenance updates Opengrep.

Inline suppressions must use the form `nosemgrep: <rule-id> -- <reason>`, or
carry the reason in a comment directly above. `task check:suppressions` rejects
other forms and records each suppression in `reports/suppressions.json`.
Opengrep honors the marker anywhere on a line, even inside a string literal, so
the register reports those uses too. Fixtures use expectation annotations rather
than suppressions. See [suppressions](suppressions.md).

See [Opengrep](https://github.com/opengrep/opengrep) and the compatible
[rule test annotations](https://docs.semgrep.dev/writing-rules/testing-rules).
