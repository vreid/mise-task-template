# Source security proof of concept

Opengrep runs 41 checked-in security rules across TypeScript, C#, C, C++, Go,
Rust, and Python. Command injection, SQL injection, path traversal, and SSRF
have positive and negative fixtures in all seven languages. Unescaped HTML has
fixtures in TypeScript, Python, Go, C#, and Rust. Additional rules cover weak
hashes and disabled TLS verification in TypeScript, Rust, C, and C++.

A [measured comparison](sast-comparison.md) with CodeQL, the Clang static
analyzer, and the language linters shows where these rules stop: they follow
data within a function, not through helpers or across files. The
[coverage matrix](owasp-cwe-coverage.md) distinguishes proven API patterns,
language guarantees, analyzer rules, runtime checks, and application-specific
review. This is broader coverage of the OWASP Top 10 and CWE Top 25, not a
promise to recognize every vulnerability or framework.

## Tasks

| Task              | Behavior                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `task check:sast` | Test the rules, then fail on matching repository vulnerabilities. |
| `task test:sast`  | Check the positive and negative fixtures without executing them.  |

Both `task check` and `task verify` include `check:sast`, so the pre-commit
hook, VS Code task, and maintenance use it too. `task test` includes the rule
tests. Opengrep findings and analysis errors fail the check; formatting remains
governed by the existing formatting tasks.

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

The command-injection rules use taint analysis: environment variables and
command-line arguments are treated as untrusted, followed through local
assignments and expressions, and reported when used as shell command text. A
shell is any of `sh`, `bash`, `dash`, `zsh`, `ksh`, `cmd`, or PowerShell, with
or without a `/bin/` or `/usr/bin/` path. `DEMO_INPUT` is the example
environment variable; the rules match any name.

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
earlier, environment-only rules; all are now caught. The command-injection rules
do not yet model HTTP input, files, stdin, custom wrappers, cross-file flows, or
application-specific sanitizers. Existing application code and any future
projects need rules for their actual trust boundaries and APIs. Absence of a
finding is not evidence that arbitrary code is safe.

## Additional data-flow checks

The `data-injection.yml` rules follow environment/argument input into SQL APIs,
file opening, outgoing requests, and raw HTML APIs. They also recognize common
request query/form/body sources in TypeScript, Python, Go, and C#. The exact
patterns in each rule are the supported boundary; no cross-file analysis or
arbitrary wrapper inference is claimed.

Each rule recognizes only the calls below; the same weakness through any other
API is not detected. Lists come from the rules' sink patterns.

| Language   | SQL                                                             | File paths                                                                           | Outgoing requests                                                                | Raw HTML                                                                                         |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| TypeScript | `.query`, `.execute`                                            | `fs` and `fs/promises` read, write, append, open, unlink, rm, readdir, stat, streams | `fetch`, `axios.get`                                                             | `innerHTML`, `outerHTML`, `document.write(ln)`, `insertAdjacentHTML`, `createContextualFragment` |
| Python     | `.execute`, `.executemany`, `.executescript`                    | `open`, `pathlib.Path`                                                               | Requests (all verbs and `request`), `httpx.get`/`post`, `urllib.request.urlopen` | `markupsafe.Markup`, Django `mark_safe`                                                          |
| Go         | `.Query`, `.QueryContext`, `.Exec`                              | `os.Open`, `os.ReadFile`                                                             | `http.Get`, `Head`, `Post`, `PostForm`, `NewRequest(WithContext)`                | `template.HTML`                                                                                  |
| C#         | `SqlCommand` constructors, `CommandText`, Dapper-style `.Query` | `File.ReadAllText`, `File.OpenRead`                                                  | `HttpClient.GetAsync`, `GetStringAsync`                                          | `HtmlString`, `Html.Raw`                                                                         |
| Rust       | `sqlx::query`, `rusqlite` `execute`                             | `std::fs::read`, `read_to_string`                                                    | `reqwest::get`                                                                   | Maud `PreEscaped`                                                                                |
| C/C++      | `sqlite3_exec`, `sqlite3_prepare_v2`                            | `fopen`                                                                              | libcurl `CURLOPT_URL`                                                            | none                                                                                             |

Fixtures prove that bound SQL parameters, fixed file paths and destinations, and
escaped/text output stay unflagged. They do not prove arbitrary validation
helpers safe. Environment variables are deliberately treated as untrusted;
applications with a trusted deployment-only source can record a narrow,
justified exception.

TypeScript module sinks (`child_process`, `fs`, `crypto`, axios) are recognized
whatever the local name, through namespace, named, aliased, default, `require`,
and awaited dynamic imports, including destructured ones. Opengrep resolves
namespace, named, aliased, and `require` imports to their module itself; for
default and dynamic imports the rules match the import statement. Fixtures cover
each added form, and a probe of the same calls on an unrelated module or with
constant arguments found no findings. Weak hashes include `md4`, `md5`, and
`sha1` in any case, with or without an `RSA-` prefix.

The `unsafe-security.yml` checks require modern hashes and certificate
verification. A legacy non-security checksum can use a named exception with a
reason. Supporting a new API or sanitizer requires a corresponding unsafe and
safe regression fixture.

## Fixtures and rule maintenance

`security/tests` mirrors the language directories in `security/rules`, with
fixtures paired by basename with each YAML rule. Every language has an expected
unsafe flow (`ruleid:`), a safe argument list (`ok:`), and a constant shell
command (`ok:`). TypeScript additionally tests import aliases, namespace,
default, and dynamic imports, an unrelated API with the same method name, and
`.mts` files. These are source fixtures, not runnable demonstrations: no task
compiles or executes them.

The native `opengrep scan --test` runner verifies expected findings and rejects
unexpected ones. Only the normal repository scan excludes this fixture
directory. There are no blanket exclusions for application tests. Ruff has
narrow exceptions for the Python fixture's deliberate subprocess examples and
native test annotations; its other checks and formatting remain enabled. The
original command-injection TypeScript fixtures remain in lint/type-check scope.
The additional data-injection and unsafe-security fixtures use framework API
fragments and are excluded from TypeScript lint/type checking; the matching
Python data-injection fixture is excluded from Ruff. Opengrep regression tests
still verify every rule against those deliberately unsafe fragments. C, C++, C#,
Go, and Rust fixtures live outside the application projects.

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
