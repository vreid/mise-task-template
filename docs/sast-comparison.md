# SAST comparison: this toolchain and CodeQL

This document records a measurement, not a recommendation from marketing
material. The question was whether CodeQL is as good as it is claimed to be,
especially at following untrusted data through helper functions and across
files, where Opengrep stops.

## Result in brief

On a small synthetic corpus of 98 compilable programs in seven languages:

- **CodeQL, configured for command-line input, found all 70 unsafe programs**,
  including every same-file and cross-file wrapper. It also flagged 6 of 28 safe
  programs.
- **CodeQL's default configuration found 25 of 70.** It treats only network
  input as untrusted. In Python, Go, C#, and Rust it reported nothing for
  programs that pass an environment variable to a shell. This matters for any
  GHAS rollout: command-line tools need the `local` threat model.
- **Opengrep found the 14 direct flows and nothing through a function.** With
  `--taint-intrafile` it also found all 28 same-file wrappers. It found none of
  the 28 cross-file wrappers, with or without that option.
- **The Clang static analyzer in CTU mode** found every command-injection case
  in C and C++, cross-file included, but no path traversal: `fopen` is not one
  of its default taint sinks.
- **Ruff, gosec, and the .NET analyzers** mostly flag by pattern (for example,
  any `shell=True`), so they flag safe programs as readily as unsafe ones. The
  .NET analyzers reported nothing.

This confirms CodeQL's cross-file data flow for these shapes. It does not show
that CodeQL finds most real vulnerabilities; published studies on real code
report the opposite for CodeQL and every other tool measured (see
[evidence from studies](#evidence-from-studies)).

## Method

### Corpus

`security/comparison/<language>/<case>/` holds one small program per case, in
TypeScript, Python, Go, C#, Rust, C, and C++. Each language has the same 14
cases: two weakness classes times seven shapes.

| Shape                 | Untrusted input reaches the sink…                   | Expected |
| --------------------- | --------------------------------------------------- | -------- |
| `direct`              | in one function                                     | finding  |
| `sink-wrapper`        | through a helper around the sink, same file         | finding  |
| `source-wrapper`      | through a helper around the source, same file       | finding  |
| `sink-wrapper-file`   | through a sink helper in another file or package    | finding  |
| `source-wrapper-file` | through a source helper in another file or package  | finding  |
| `safe-constant`       | never; the cross-file sink helper gets a constant   | none     |
| `safe-api`            | no shell (fixed executable), or an allowlisted path | none     |

The classes are command injection (CWE-78) and path traversal (CWE-22). The
untrusted input is the `INPUT` environment variable. Sinks are standard-library
calls that every tool here models, for example `execSync` and `readFileSync`,
`subprocess.run(..., shell=True)` and `open`, `system` and `fopen`. Function and
module names are unique per case, so no tool can link a call to another case's
helper.

All programs compile without errors: TypeScript 7 strict, Python byte
compilation, `go vet`, `cargo check`, `dotnet build`, and Clang syntax checks
with C17 and C++20. Type-based tools are therefore not handicapped by fragments.

### Tools and configuration

| Tool                 | Configuration                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Opengrep 1.30.0      | This repository's 41 rules; once as in `task check`, once with `--taint-intrafile`                  |
| Ruff 0.16.10         | Repository configuration, `S` (security) rules only                                                 |
| golangci-lint 2.14.0 | Repository configuration, gosec only                                                                |
| .NET SDK 10.0.401    | `AnalysisLevel=latest-all`; security rules (CA2100, CA23xx, CA30xx, CA31xx, CA5xxx, SYSLIB) counted |
| Clang 23.1.2         | `analyze-build` with `optin.taint.GenericTaint`, per file and with `--ctu`                          |
| CodeQL 2.27.1        | `security-extended` suite; default threat model, then `--threat-model=local`                        |

CodeQL extracts TypeScript, Python, C#, and Rust without a build, and Go and
C/C++ from a traced build. Each C/C++ case is its own database because CodeQL
treats one database as one program and every case defines `main`. No queries,
rules, or models were added or tuned for this corpus.

A case counts as found when the tool reports any finding inside its directory;
for a safe case, any finding is a false positive. The per-case rule IDs are in
the generated `results.md`.

### Running it

The canonical run is the `sast-comparison` workflow on Ubuntu 24.04, which
downloads the pinned CodeQL bundle, verifies its checksum, and uploads
`reports/comparison/` for three days. It runs on demand and on pull requests
that change the corpus, the rules, or the harness. Locally:

```bash
mise exec -- task check:sast-comparison CODEQL=/path/to/codeql
```

On macOS, CodeQL's build tracer cannot extract Go (the autobuilder aborts), so
the local run marks CodeQL Go as "not run". All other results matched the Linux
run exactly.

CodeQL is not part of the toolchain. Its license permits analysis of open-source
codebases; this repository is public and released under the Unlicense, an
OSI-approved license. The same use on private code requires a paid GitHub
license.

## Results

From the Linux workflow run 37499382304 for pull request #5. Cells are
found/total.

| Cases              | Opengrep | Opengrep intrafile | Ruff/gosec/.NET | Clang per file | Clang CTU | CodeQL default | CodeQL local |
| ------------------ | -------: | -----------------: | --------------: | -------------: | --------: | -------------: | -----------: |
| Direct             |    14/14 |              14/14 |             3/6 |            2/4 |       2/4 |           5/14 |        14/14 |
| Same-file wrapper  |     0/28 |              28/28 |            5/12 |            4/8 |       4/8 |          10/28 |        28/28 |
| Cross-file wrapper |     0/28 |               0/28 |            5/12 |            0/8 |       4/8 |          10/28 |        28/28 |
| Safe (flagged)     |     7/28 |               7/28 |            6/12 |            2/8 |       2/8 |           2/28 |         6/28 |

By language, as unsafe programs found · safe programs flagged (10 unsafe and 4
safe per language):

| Language   | Opengrep | Opengrep intrafile | Ruff/gosec/.NET | Clang per file | Clang CTU | CodeQL default | CodeQL local |
| ---------- | -------: | -----------------: | --------------: | -------------: | --------: | -------------: | -----------: |
| TypeScript |    2 · 1 |              6 · 1 |             n/a |            n/a |       n/a |          5 · 0 |       10 · 0 |
| Python     |    2 · 1 |              6 · 1 |           5 · 2 |            n/a |       n/a |          0 · 0 |       10 · 0 |
| Go         |    2 · 1 |              6 · 1 |           8 · 4 |            n/a |       n/a |          0 · 0 |       10 · 1 |
| C#         |    2 · 1 |              6 · 1 |           0 · 0 |            n/a |       n/a |          0 · 0 |       10 · 1 |
| Rust       |    2 · 1 |              6 · 1 |             n/a |            n/a |       n/a |          0 · 0 |       10 · 2 |
| C          |    2 · 1 |              6 · 1 |             n/a |          3 · 1 |     5 · 1 |         10 · 1 |       10 · 1 |
| C++        |    2 · 1 |              6 · 1 |             n/a |          3 · 1 |     5 · 1 |         10 · 1 |       10 · 1 |

### Observations

- **Threat model.** By default CodeQL reported environment input only through
  JavaScript's dedicated `js/indirect-command-line-injection` query and the
  C/C++ queries. Python, Go, C#, and Rust needed `--threat-model=local`.
- **False positives differ in kind.** Opengrep has no sanitizer model, so it
  flags every allowlisted path. CodeQL recognized the allowlist in TypeScript
  and Python, but not in Go, C#, Rust, or C/C++, and in Rust it also flagged an
  argument passed to `printf` without a shell. Clang flagged that `printf` call
  through `execl`. These are judgment calls an application owner would review.
- **Opengrep's `--taint-intrafile`** closes the same-file wrapper gap; a full
  scan of this repository still takes about one second. On the existing rule
  fixtures it misses two TypeScript lines that the default mode finds, so
  enabling it needs that fixed first.
- **Clang CTU** is the only free tool here that crossed files, in C and C++. Its
  path-traversal result depends on a taint configuration that adds `fopen` as a
  sink.
- **gosec's taint rules** (G702, G703) found direct flows and same-file sink
  wrappers; its pattern rules G204 and G304 flag any non-constant argument, safe
  or not. Ruff's `S602` flags `shell=True` regardless of data, and Ruff reported
  none of the path cases. The .NET analyzers reported nothing for environment
  input.

### CodeQL on the Opengrep fixtures

On the rule fixtures in `security/tests`, CodeQL with local input found 38 of 79
unsafe lines and flagged none of 63 safe lines. Go fixtures could not be built.
Those fixtures are partial programs written for Opengrep, with undeclared
variables such as `db`, so type-based analysis loses track of many calls. The
result describes the fixtures more than CodeQL, which is why the neutral corpus
exists.

## Limits

- The corpus is small, synthetic, and written by the same author as the Opengrep
  rules. Detection here is an upper bound for real code, as the studies below
  show for every tool.
- Two weakness classes, one source kind (environment variables), and
  standard-library sinks only. Frameworks, HTTP input, callbacks, class
  hierarchies, and real build systems are not covered.
- CodeQL ran with its stock queries. Opengrep ran with rules written for this
  repository and limited to the APIs they list.

## Evidence from studies

Published measurements on real vulnerabilities, checked against the papers'
abstracts:

- On CWE-Bench-Java, 120 manually validated vulnerabilities in real Java
  projects, CodeQL detected 27 (IRIS, ICLR 2025). The authors propose a
  competing LLM-assisted tool.
- Applied to 258 open-source embedded projects, CodeQL reported 709 true
  defects, with a false-positive rate of 34% (ISSTA 2025).
- Seven free Java SAST tools together detected 12.7% of real-world
  vulnerabilities, despite good results on synthetic benchmarks (ESEC/FSE 2023).
- Five free and one commercial C/C++ analyzers each missed 47% to 80% of 192
  real vulnerabilities; combining them reduced misses to 30% to 69% (ISSTA
  2022). The per-tool breakdown was not checked.

Sources:

- [IRIS: LLM-Assisted Static Analysis for Detecting Security Vulnerabilities](https://proceedings.iclr.cc/paper_files/paper/2025/hash/582d4e27fa24168f3af1f4582655034b-Abstract-Conference.html)
- [Finding 709 Defects in 258 Projects: Applying CodeQL to Open-Source Embedded Software](https://arxiv.org/abs/2310.00205)
- [Comparison and Evaluation on Static Application Security Testing (SAST) Tools for Java](https://2023.esec-fse.org/details/fse-2023-research-papers/21/-Remote-Comparison-and-Evaluation-on-Static-Application-Security-Testing-SAST-Tool)
- [An Empirical Study on the Effectiveness of Static C/C++ Analyzers for Vulnerability Detection](https://conf.researchr.org/details/issta-2022/issta-2022-technical-papers/20/An-Empirical-Study-on-the-Effectiveness-of-Static-C-C-Analyzers-for-Vulnerability-D)

## What follows for this repository

- Same-file wrappers: enable Opengrep's `--taint-intrafile` after fixing the two
  fixture lines it misses.
- C and C++ across files: run the Clang static analyzer in CTU mode with a taint
  configuration that includes the path sinks.
- Other languages across files: no free tool here did it. Generated wrapper
  rules remain the option, measured against this corpus.
- A GHAS evaluation must enable the `local` threat model for command-line
  programs, or it will under-report exactly these cases.
