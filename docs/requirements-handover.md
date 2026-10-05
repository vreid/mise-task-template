# Static analysis requirements handover

This document hands the repository and the agreed interpretation of its
requirements to another developer or coding CLI. It records decisions from the
discussion, implementation evidence, and remaining work as of 2026-10-05. Use it
to review the proof of concept without reopening settled scope decisions.

The repository demonstrates a shared analysis toolchain across seven languages.
Analysis runs record fresh, hashed artifacts, check completion states,
classified findings, and full diagnostic logs. Forty-one tested Opengrep rules
complement the language analyzers. CI retains artifacts for three days and
compares them with an available baseline; this retention and the existing
advisory license policy were reaffirmed for the PoC on 2026-10-05.
Dependency-Track and SecObserve remain optional deployment destinations, not
implemented integrations.

## Source and scope

The source is the two-page document titled _Requirements for Static Code
Analysis_, whose requirements section is dated 2026-08-26. The local reference
is now `requirements.pdf`; its original export filename was
`Requirements for Static Code Ana_eaaf61388e01464e99679ef91fe0164e-041026-1936-154.pdf`.
Both filenames are ignored and the PDF must not be committed. This handover
summarizes the requirements and subsequent decisions instead of reproducing the
document.

The source distinguishes required capabilities from preferences, including a
preference for a single tool and for open-source tooling. Its introductory
discussion of compliance is motivation, not evidence that running these tools
establishes regulatory compliance.

The following scope decisions were explicitly agreed:

- This is a minimal, maintainable proof of concept and template, not a company
  rollout framework or certification exercise.
- One root toolchain serves matching TypeScript, C#, C, C++, Go, Rust, and
  Python examples under `examples/`. Do not copy the template into each example.
- One Task entry point can coordinate several specialized engines. A single
  vendor or analysis engine is a preference, not a prerequisite for the demo.
- Automatic onboarding or discovery of future modules is outside this demo's
  scope. Broad file discovery where supported is still useful.
- Organizational rollout, legacy-project adoption, ownership, mandatory-use
  policies, company coding guidelines, and final company license and
  false-positive policies are outside this repository's scope. `task check:new`
  demonstrates the baseline mechanism for existing projects; each project's
  baseline policy remains its own decision (see [baseline](baseline.md)).
- Dependency-Track and SecObserve may supply central reporting and finding
  management. Their selection does not mean uploads or gates are implemented.

## Requirement coverage

"Implemented" below means there is repository configuration or a task providing
the capability within its documented scope. It does not imply universal
detection, a successful run on every platform, or completed central reporting.

| Requirement                                | Current coverage and remaining qualification                                                                                                                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scan source for vulnerabilities            | Forty-one tested Opengrep rules cover command/SQL injection, path traversal, SSRF, raw HTML, weak hashes, and disabled TLS across their documented languages and APIs. Native analyzers add other signals.                                                                                        |
| OWASP Top 10 and CWE Top 25                | The coverage matrix records tested API patterns and distinguishes remaining rule-only, runtime, language-safety, and application-context evidence. No claim of universal detection is made.                                                                                                       |
| Classify findings by severity              | Native scanner findings and located lint/compiler diagnostics are classified high/medium/low. Other failed checks retain their complete diagnostics as check findings. Missing evidence is explicitly incomplete and fails.                                                                       |
| Archivable reports tied to a version       | Each run clears stale output and records commit, run ID, platform, completion states, and artifact hashes. CI archives the reports for the agreed three-day PoC retention.                                                                                                                        |
| Prefer one tool across supported languages | Task provides a common CLI over several engines. This is the accepted design. Opengrep, Syft, scc, and Lizard each cover multiple languages or ecosystems.                                                                                                                                        |
| Dependency CVEs                            | Syft and Grype inventory the repository and gate High/Critical findings; unfixed ones need an explicit acceptance with a reason that expires when a fix ships. Narrow exceptions cover Go code compiled into TypeScript's compiler. Detection depends on package metadata and supported matchers. |
| Linting                                    | Configured for every example language, shell helpers, Markdown, and GitHub Actions. Python lint and annotations are covered; Python type checking is not implemented.                                                                                                                             |
| SBOM generation                            | `check:sbom` writes CycloneDX and SPDX SBOMs of the gated inventory to `reports/`. Delivery to Dependency-Track is assumed, not implemented; see [analysis reports](reports.md).                                                                                                                  |
| Accept, report, and log findings           | Inline suppressions must name rules and give reasons; `check:suppressions` enforces this and records them with Git attribution. Secrets are accepted by fingerprint in `.betterleaksignore`. Central assessment in SecObserve is assumed, not connected.                                          |
| Reject PRs through a pipeline              | `main` is protected: the three `verify` jobs are required status checks, branches must be up to date, conversations resolved, and the rules apply to administrators. A central security gate would need an explicit pipeline query.                                                               |
| CLI and CI integration                     | mise and Task supply the CLI; the workflow runs Linux, native Windows, and macOS, and all three pass.                                                                                                                                                                                             |
| IDE integration                            | VS Code workspace settings connect eight recommended extensions to the pinned linters and configurations for live diagnostics; `task check` problem matchers list located findings, including Opengrep and Betterleaks. Tested in VS Code on macOS; see [VS Code](vscode.md).                     |
| Observable results and preferred trends    | Console diagnostics, per-commit artifacts, SLOC PR comparisons, and finding-count comparisons against a retained successful baseline. Missing baselines are explicit.                                                                                                                             |
| Dependency license allowlist               | Grant checks exact SPDX IDs marked OSI-approved, as a placeholder until a legal list exists; that list is a separate project. Findings are advisory and reported as low. Grant is unavailable on native Windows; Linux and macOS run the policy.                                                  |
| Common code smells and antipatterns        | Strict language linters, compiler diagnostics, clang-tidy, and Lizard provide concrete checks. No separately agreed architectural-boundary rule exists.                                                                                                                                           |
| Current and additional SLOC                | scc writes current size to `reports/sloc.json`. On each pull request, CI comments the code-line difference per language against the target branch as it stands.                                                                                                                                   |
| Prefer open-source tools                   | The selected analysis tools are open source. Tool choice and dependency-license compliance are separate questions.                                                                                                                                                                                |
| Secret scanning                            | Betterleaks scans the working tree and generated reports and ignores inline allow comments; `verify` also scans history reachable from `HEAD`. Detection scope still follows its supported formats and exclusions.                                                                                |
| Cyclomatic complexity and other metrics    | Lizard writes every function's CCN, NLOC, and parameters to `reports/complexity.csv`, then enforces the limits. scc reports size and approximate file-level complexity on the console.                                                                                                            |
| Auditable comment-based exceptions         | `check:suppressions` requires a specific rule and a reason for every inline suppression of every tool and exports the register, with Git attribution, to `reports/suppressions.json`. Configuration exemptions are reviewed through Git only.                                                     |
| Preferred memory-leak detection            | clang-tidy includes static leak checks; C/C++ tests use ASan and UBSan, with LeakSanitizer on Linux and macOS. Windows has no LeakSanitizer. MSan and Valgrind remain deferred.                                                                                                                   |
| Organizational scope and policy decisions  | Explicitly outside this repository's PoC scope. Do not report their absence as missing implementation in this template.                                                                                                                                                                           |

## Decisions about the ambiguous requirements

### OWASP and CWE coverage

The original demonstration used command injection in every language. The audit
follow-up expanded it to 41 checked-in rules with unsafe and safe fixtures for
SQL injection, path traversal, SSRF, unescaped HTML, weak hashes, and disabled
TLS verification. See [source security rules](sast.md) for exact APIs.

The examples have no production web, authentication, authorization, upload, or
deployment functionality. Those controls require an application's actual trust
boundaries and frameworks. The coverage matrix preserves gaps and contextual
review requirements rather than treating metadata, language safety, or enabling
a scanner as proof that every OWASP/CWE weakness is detected.

### PR enforcement

mise-action installs the pinned development tools. The workflow runs
`task verify` for analysis and tests; dependency restoration belongs to that
task. A separate task computes the available baseline trend. Enforcement
additionally requires the three matrix results to be required status checks in
GitHub. Local hooks are useful feedback and are bypassable.

The workflow has no optional `name:` fields; analysis has read-only repository
and Actions permissions, with PR-comment permission confined to the SLOC job. It
runs on pull requests, pushes to `main`, and manual dispatch. Action references
are pinned to commit SHAs. actionlint runs in `check` and `verify`; actions-up
updates those pins during maintenance. Neither tool alone configures repository
branch rules.

### Version identity for reports

No company-wide versioning scheme has been agreed. Historical practice used
GitVersion with a tag plus commits since the tag, or just the tag. A commit SHA
is useful for exact source identity, but the requirement does not settle the
human-facing version convention.

Reports are identified by the analyzed commit, which is independent of any
version scheme: `reports/manifest.json` records it with a dirty flag, timestamp,
and platform, and the SBOM uses it as its version unless release tooling
supplies `REPORT_VERSION`. The tools are pinned by `mise.lock` at that commit.
Conventional Commit messages are implemented; they do not choose a
release-version scheme.

A proposed report record should also identify the repository, branch or PR,
baseline when relevant, tool versions, timestamp, and platform. Be explicit
about which checked-out commit was analyzed, including a PR merge result if that
is what CI tested. Choosing a new company versioning standard is outside this
repository's scope.

### Additional SLOC

The accepted interpretation is to run the same counting policy against the
baseline and the PR, then compare results. No new service is needed to
demonstrate that capability.

The baseline is the current target branch, compared with the checked-out PR
merge snapshot. The current working tree's root and nested ignore policy is
applied to both snapshots. Those are different measurements when the target
branch has moved. Net SLOC change is also different from added and deleted
source lines. Name the reported metric rather than treating the terms as
interchangeable. Both sides need the same tool version and exclusions, and CI
needs enough Git history to resolve the chosen baseline.

### Architectural antipatterns

The requirements give an example resembling "no code used only for tests in
production" without defining production roots, test-only dependencies, permitted
seams, or the intended language-level boundary. That is not precise enough to
derive one mandatory architecture rule.

Existing smell and complexity checks are accepted PoC evidence. A concrete
production-to-test import rule could be an optional demonstration after agreeing
its meaning, but its absence is not a PoC blocker. Do not invent a mandatory
architecture framework, duplication gate, or module-onboarding system.

## Established implementation conventions

### Tool versions and task structure

- Prefer mise's `idiomatic_version_file_enable_tools` whenever supported. Node
  and pnpm come from root `package.json` `devEngines`; Task uses its
  `version: "3"`; .NET, Go, Rust, Python, and golangci-lint use their native
  files. Exact resolved releases live in `mise.lock`.
- Keep mise's generated Python dependency sidecars under `.mise/locks` with the
  tool lock. These lock Lizard's isolated CLI environment.
- Runtime environment settings belong in Task. Avoid reintroducing a separate
  mise `[env]` policy or one-off tool-version updater.
- Keep one included Taskfile per verb under `tasks/`. Main verbs compose smaller
  tasks; longer shell operations live under `scripts/`.
- `setup` installs locked tools, restores committed dependency locks, and
  installs hooks. `verify` restores dependencies before analysis and tests. An
  absent or stale dependency lock is repaired through maintenance, not by
  weakening normal frozen restores.
- `maintenance` updates tools, all npm dependency groups and ranges including
  major upgrades, action pins, and the license list, then restores, fixes, and
  verifies. Keep the selected Node and pnpm majors. The current runtime helper
  refreshes exact .NET and Rust pins within their selected majors.

### Check and fix behavior

`task check` reports formatting differences without failing for those
differences. Lint, type, security, complexity, suppression, configuration, and
tool failures still fail. C/C++ compiler warnings are advisory here; clang-tidy
policy findings remain enforced. License policy findings are advisory by
request.

`task verify` builds, analyzes, enforces formatting and adopted compiler
diagnostics, and runs tests. License findings remain advisory here too.
`task fmt` formats; `task fix` applies supported lint fixes and formatting.
Fixing code does not automatically approve licenses or suppress vulnerabilities.

Oxfmt owns supported repository files, including `package.json` and Markdown.
Markdown uses an 80-column target and `proseWrap: "always"`, with unavoidable
exceptions such as tables and long identifiers. The formatter runs until its
check passes, with at most five write passes, because JSON cleanup and ordering
can require separate passes. Oxfmt and Oxlint use TypeScript configs; strict
TypeScript checking covers configuration and helper files too. Markdownlint uses
the accepted `.mjs` loader plus `.mts` configuration combination.

Lefthook runs `task check` before committing and validates Conventional Commit
messages at `commit-msg`. The VS Code task intentionally has no problem matcher
or extension-specific integration.

### Language and infrastructure checks

| Area           | Selected tools and policy                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript     | Strict Oxlint with type-aware analysis and type checking; strict `tsconfig.json`; Oxfmt; Node's test runner.                                                                                                                                      |
| C#             | SDK `latest-all` analyzers, build-time style analysis, nullable checks, and warnings as errors; `dotnet format`. This is the SDK-supported broad set, not every historical diagnostic.                                                            |
| Go             | golangci-lint with strict checks; gofumpt and goimports handled separately so formatting stays advisory in `check`; Go tests.                                                                                                                     |
| Rust           | Clippy standard and pedantic checks plus selected restrictions, including reasons on lint attributes; warnings as errors; unsafe code forbidden; rustfmt and Cargo tests. Do not enable the whole conflicting restriction group indiscriminately. |
| Python         | Ruff's stable `ALL` rules with documented conflicts excluded; Ruff formatting and standard-library doctests. Standalone Python files do not need a Python application project.                                                                    |
| C and C++      | Clang, clang-tidy, clang-format with LLVM baseline, and ASan/UBSan test builds. C17 and C++20 are the selected standards.                                                                                                                         |
| Shell          | ShellCheck and shfmt, including repository helper scripts.                                                                                                                                                                                        |
| Markdown       | Oxfmt for formatting and markdownlint for content and structure.                                                                                                                                                                                  |
| GitHub Actions | actionlint in normal checks; actions-up in maintenance and an optional update-preview task.                                                                                                                                                       |

For C/C++, the user explicitly resolved the conflict between `-Weverything`,
`-Werror`, and painless compiler upgrades: freeze the required diagnostic policy
while reporting newly introduced compiler diagnostics as advisory.
`.clang-warnings.json` records symbolic diagnostic IDs. The verification helper
first compiles with `-Werror`, then classifies failures against that policy. It
must not downgrade real compiler errors or adopted warnings. Explicit
`maintenance:clang-warnings` adopts new diagnostics after review; ordinary
maintenance does not silently broaden the required policy. clang-tidy also uses
an explicit check list. This compatibility promise is specific to the configured
Clang policy, not every tool upgrade.

ASan and UBSan instrument the implementation and unit tests. The user chose to
defer MSan because it needs a suitable separate environment and instrumented
dependencies, including the C++ standard library. Valgrind is also deferred. Do
not claim universal leak or uninitialized-read detection from ASan/UBSan. See
[C and C++ details](c-cpp.md) and [language checks](language-checks.md).

Lizard's required limits are CCN 10, function NLOC 60, and five parameters, with
a 1,000-line physical-length backstop and zero violations allowed. It writes
every function's metrics to `reports/complexity.csv` before checking them. Its
`outside` extension covers top-level logic. A small adapter includes `.mts` and
`.cts`. Nesting gates were omitted because of demonstrated parser behavior;
cognitive complexity is unavailable in the pinned release. Duplication is not
gated because the examples intentionally implement the same algorithm. scc's
approximate per-file complexity and overall size remain advisory. See
[code metrics](code-metrics.md).

## Security and license policy decisions

Syft scans the repository with every supported non-deprecated cataloger,
including installed and development dependencies, lockfiles, generated outputs,
vendored files, supported archives, and binaries. Only `.git` and the generated
`reports/` folder are excluded. File metadata cataloging is off, so the
CycloneDX output contains no absolute host paths. Tools installed by mise
outside the repository and unsupported or undetected packages are outside that
inventory. Metadata enrichment may contact upstream registries.

The allowlist currently contains **all OSI-approved licenses**, including GPL
and AGPL, as a placeholder. No legal list of accepted license types exists yet;
defining one is a separate project with legal review, outside this PoC. The
[Open Source Definition](https://opensource.org/osd) prohibits discrimination
against business use, so company size alone is no reason to exclude a license.
This is an allowlist mechanism, not a conclusion that every use satisfies
notices, source-sharing, copyleft, or compatibility obligations. License
findings stay advisory until that list exists.

Grant checks exact SPDX IDs from the maintained OSI list. Unknown and missing
licenses remain findings; there are no blanket package exemptions. License
findings warn without blocking by explicit user request, while scanner or
inventory failures still fail. Native Windows reports the unavailable Grant
check explicitly, with the Linux and macOS jobs retaining it. SPDX expression
handling and metadata quality can still require review.

Grype fails on every High and Critical vulnerability, fixed upstream or not, and
shows accepted findings with their locations and reasons. An unfixed finding
needs an explicit acceptance: `braces@3.0.3` is accepted because only
repository-controlled glob patterns reach it, with `fix-state: not-fixed` so the
acceptance ends when a fix ships. A published fix does not prove that a parent
dependency has shipped a usable update. The repository therefore has a narrow
exception for `GO-2026-5970` in `golang.org/x/text@v0.38.0`, embedded in
TypeScript 7.0.2's compiler binary. Its advisory, version, and location
constraints must be reviewed during maintenance; do not generalize it into an
exemption for all transitive tools. On native Windows, Syft records no Go
symbols for PE binaries, so Grype matches the same compiler's go1.26.4 standard
library by module. Seven High advisories that Linux and macOS clear by function
are ignored for that package version at the Windows compiler path only; none of
them is Windows-specific.

The earlier `braces` finding was traced through npm dependencies using
`pnpm audit` and `pnpm why braces`. `task check:audit` runs
`pnpm audit --audit-level high` only on demand. It is deliberately absent from
normal `check`, `verify`, and maintenance gates because it can fail for findings
with no published fix. Dependency trees and vulnerability databases change;
recheck current findings instead of treating these examples as a permanent
inventory. See [security details](security.md).

Betterleaks redacts findings, disables live credential validation, and ignores
inline allow comments, which named neither rule nor reason. Both scans pass an
explicit configuration, so a dropped-in `.gitleaks.toml` cannot silence them.
`verify` adds a scan of the history reachable from `HEAD`, so a secret committed
and then deleted still fails; it refuses shallow clones, and CI fetches full
history.

Opengrep uses checked-in taint and structural rules and positive and negative
regression fixtures. Those deliberately unsafe fixtures are scanned, never
executed. Application tests stay in normal analysis scope. The helper handles
`.mts` and `.cts` explicitly because of the pinned engine's discovery
limitation. The rules model selected environment, argument, and HTTP sources and
API sinks. Arbitrary wrappers, other frameworks, and cross-file flows need
additional application-specific analysis. Inline suppressions must identify a
rule and give a reason; `check:suppressions` enforces this for Opengrep and
every other tool, including markers that Opengrep honors inside string literals.

## Assumed reporting platforms and actual remaining work

[Dependency-Track's CI integration](https://docs.dependencytrack.org/usage/cicd/)
can receive CycloneDX inventories associated with projects and versions. It is
the assumed destination for dependency inventory and ongoing component analysis.
No server URL, credentials, project mapping, or upload task has been configured
in this repository.

SecObserve is the assumed destination for central security findings and
assessments. Its
[assessment workflow](https://secobserve.github.io/SecObserve/usage/assess_observations/)
records severity or status changes with mandatory comments in an observation
log. It supports
[branches and versions](https://secobserve.github.io/SecObserve/usage/branches/),
[scanner imports](https://secobserve.github.io/SecObserve/integrations/supported_scanners/),
and
[security gates](https://secobserve.github.io/SecObserve/usage/security_gates/).
Dependency-Track can be imported through its API. Format compatibility,
deduplication, and a successful actual import still need to be demonstrated.

The artifact retention remains three days by explicit PoC decision. Finding
trends compare with a retained successful run on the target branch and same
runner; no available baseline is reported as unavailable rather than zero.
Long-term storage, centralized assessment, organizational rollout, and a final
company license policy remain deployment decisions outside this template.

Required verification checks on `main` enforce PR rejection. Changes to the
workflow and policy still require review; branch protection does not make a
scanner complete or prove a company's compliance obligations.

## Validation evidence

Full `task verify` passed locally on macOS, including from a clean checkout
without running `setup` first. actionlint accepted the workflow and rejected a
deliberately invalid matrix reference. The actions-up preview and update tasks
ran successfully. Tool download entries were resolved for Linux x64, Windows
x64, and macOS ARM64 without changing existing pinned tool versions.

The
[first hosted matrix run](https://github.com/vreid/mise-task-template/actions/runs/37228105681)
passed on Linux and macOS but failed on Windows in `verify:cpp`, before any
later task ran. Fixing it on the `fix/requirements-gaps` branch exposed three
more Windows-only problems in sequence. All four were fixed without weakening
the shared policy:

- clang-tidy's `bugprone-exception-escape` traced exceptions from the MSVC
  standard library's streams out of both C++ `main` functions. Both now catch
  everything in a function-try-block and return 1.
- Lizard's interpreter lookup resolved a launcher symlink, but mise installs a
  standalone launcher on Windows. The check now finds the environment's
  `pyvenv.cfg` beside the launcher.
- Syft records no Go symbols for PE binaries, so Grype reported seven High
  standard library advisories in TypeScript's `tsc.exe` that Linux and macOS
  clear by function. Narrow exceptions cover exactly those advisories at that
  path; see [security details](security.md).
- Windows test executables could not load Clang's dynamic sanitizer runtime. The
  test helper adds the compiler's runtime directory to `PATH` on Windows.

[Run 37233061266](https://github.com/vreid/mise-task-template/actions/runs/37233061266)
was the first to pass on all three platforms, with every task executed on
Windows, including the C and C++ sanitizer tests. Check later runs as the code
and tool versions change.

## Review instructions for the next coding CLI

Start with this document, [README](../README.md), the Taskfiles, and the linked
policy documents. If the local PDF is available, compare its actual wording with
the interpretations above without adding it back to Git.

Useful commands are:

```bash
mise trust
mise install --locked
mise exec -- task doctor
mise exec -- task verify
mise exec -- task test:sast
mise exec -- task check:actions
```

Use `task check:audit` and `pnpm why <package>` only when investigating npm
findings. Avoid `task maintenance` during a read-only audit because it changes
tool versions, manifests, locks, formatting, and possibly code.

Report requirements gaps with the relevant file or task evidence. Distinguish
implemented behavior, observed test results, intended platform capabilities, and
assumptions about external services. Focus the review on report delivery,
version identity, durable audit evidence, PR metrics, and required status
checks. Preserve the agreed advisory policies and PoC scope unless the user
explicitly changes them.
