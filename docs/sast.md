# Source security proof of concept

Opengrep checks one weakness across TypeScript, C#, C, C++, Go, Rust, and
Python: **OS command injection**, mapped to
[OWASP Top 10:2025 A05 Injection](https://top10.owasp.org/2025/A05_2025-Injection/)
and **CWE-78**, ranked ninth in the
[2025 CWE Top 25](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html).
This demonstrates a tested security rule for every example language; it does not
establish coverage of the entire OWASP Top 10 or CWE Top 25.

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

Each rule uses taint analysis: values read from the environment are treated as
untrusted, followed through local assignments and expressions, and reported when
used as shell command text. `DEMO_INPUT` is the example environment variable;
the rules match any environment-variable name.

| Language   | Sources                               | Shell sinks                                           |
| ---------- | ------------------------------------- | ----------------------------------------------------- |
| TypeScript | `process.env[key]`, `process.env.KEY` | `exec`, `execSync`                                    |
| C#         | `Environment.GetEnvironmentVariable`  | `Process.Start` with `sh` or `/bin/sh`                |
| C          | `getenv`                              | `system`, `popen`                                     |
| C++        | `getenv`, `std::getenv`               | `system`, `std::system`, `popen`                      |
| Go         | `os.Getenv`                           | `exec.Command` with `sh -c` or `/bin/sh -c`           |
| Rust       | `std::env::var`                       | `Command::new` with `sh`/`/bin/sh` and chained `.arg` |
| Python     | `os.getenv`, `os.environ` lookups     | `os.system`, `subprocess.run` with `shell=True`       |

Findings have Opengrep severity `ERROR`, impact `HIGH`, and CWE/OWASP metadata.
Messages explain the intended remediation: select a fixed executable and pass
input as separate arguments without a shell. The safe fixtures use a fixed
`printf` executable and a fixed format string, keeping input in a data argument.
This does not make arbitrary executables, options, or format strings safe.

The deliberately narrow sources and sinks keep the proof of concept reviewable.
HTTP input, command-line arguments, other process APIs, other shells, custom
wrappers, cross-file flows, and sanitizers are not modeled. Existing application
code and any future projects need rules for their actual trust boundaries and
APIs. Absence of a finding is not evidence that arbitrary code is safe.

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

The engine supports inline `nosemgrep: <rule-id>` suppressions. Any use should
name the exact rule and explain the reviewed reason in a nearby comment.
Fixtures use expectation annotations rather than suppressions.

See [Opengrep](https://github.com/opengrep/opengrep) and the compatible
[rule test annotations](https://docs.semgrep.dev/writing-rules/testing-rules).
