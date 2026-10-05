# Analysis reports

`task check` and `task verify` start a fresh analysis run in the Git-ignored
`reports/` directory. Previous output is removed before any check runs. A lock
prevents concurrent runs from mixing evidence. CI uploads the reports for three
days, the accepted retention policy for this proof of concept.

## Evidence and completion

`scripts/analyze.mts` invokes the existing Task checks, records their
completion, and continues independent checks after failures. A failed
prerequisite causes its dependents to be recorded as skipped. The final command
fails if any required check fails, skips, or omits an expected output.

`manifest.json` records the analyzed commit, dirty flag, unique run ID,
timestamp, platform, check states, exit codes, log paths, and SHA-256 hashes of
each check's outputs. `findings.json` repeats the run and commit, records
`complete` and `status`, and classifies the findings. A missing, changed,
malformed, or structurally invalid expected report produces an explicit
reporting finding and fails collection. Pending and skipped checks are
incomplete evidence, never a zero-finding success.

Every check's stdout and stderr are retained under `logs/`. Located language
linter and compiler diagnostics become individual low-severity entries. Other
failed checks retain their complete diagnostic output in a low-severity check
entry. The full logs remain available for context and for diagnostics without a
standard location format. These check entries may accompany a scanner's more
specific findings; they are not a deduplicated issue tracker.

Both Opengrep passes run even if the first finds a vulnerability. The module
pass writes an explicit empty result when there are no `.mts` or `.cts` files.

If a process is interrupted, the manifest retains unfinished states. The ignored
`.analysis-lock/` directory records the running process's ID; the next run
removes a lock whose process no longer exists, and refuses to start while
another run in the same checkout is still active. Individual `check:*` tasks are
useful diagnostics but do not create a complete run; use `check` or `verify`
before collecting or archiving evidence.

## Files

| File                                   | Content                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| `manifest.json`                        | Run identity, check completion, and artifact hashes          |
| `findings.json`                        | Classified findings, evidence completeness, and check states |
| `logs/`                                | Complete per-check console diagnostics                       |
| `sbom.cdx.json`                        | CycloneDX inventory                                          |
| `sbom.spdx.json`                       | SPDX inventory                                               |
| `sbom.syft.json`                       | Lossless inventory consumed by Grype and Grant               |
| `vulnerabilities.json`                 | Native Grype matches and accepted findings                   |
| `licenses.json`                        | Native Grant findings on Linux and macOS                     |
| `sast.json`, `sast-modules.json`       | Native Opengrep results                                      |
| `secrets.json`, `secrets-history.json` | Redacted secret findings; history is included by verify      |
| `suppressions.json`                    | Inline exceptions, reasons, and Git attribution              |
| `complexity.csv`                       | Per-function NLOC, CCN, tokens, parameters, and length       |
| `sloc.json`                            | Current size per language and file                           |
| `sloc-diff.md`                         | Net code-line difference against a target branch             |
| `trend.md`, `trend.json`               | Comparison with an available baseline run                    |

## Classification and acceptance

Native critical/high/ERROR findings map to high, medium/WARNING/moderate to
medium, and other native severities to low. Checks without security severities
use low. Evidence-integrity failures are high. Failure thresholds remain those
of the individual checks; assigning low does not make a failed check advisory.

A Grype acceptance is valid only when every applied ignore rule has a reason.
Missing reasons stay null, the finding stays open, and both the standalone
vulnerability task and final collection fail. The collector never invents a
rationale from the availability of a fix.

## Version identity and inventory

The commit and run ID identify the evidence independently of a release-version
scheme. The dirty flag distinguishes local modifications. `mise.lock` at that
commit pins the tools. The SBOM uses the commit, with `-dirty` where relevant,
unless release tooling supplies `REPORT_NAME` and `REPORT_VERSION`.

The inventory includes the applications, their dependency locks and build
outputs, and restored development dependencies within the repository. It is a
development inventory; a shipped product needs an inventory of its release
artifact. Tools installed outside the repository are not included. Syft excludes
Git metadata, generated reports, and the dedicated linter fixtures. Share the
CycloneDX or SPDX version; lossless Syft output can contain local cache paths.
See [security details](security.md).

## Comparisons and retention

`check:sloc-diff BASE=origin/main` applies the current working tree's root and
nested ignore policy to both snapshots. A change to `.sccignore`, `.gitignore`,
or `.ignore` therefore cannot masquerade as added or removed source. Its metric
is net SLOC, not separate added and deleted lines. CI posts the result for
same-repository pull requests; fork results remain in the job output.

`task check:trend` compares classified open and accepted findings with a
baseline folder supplied through `REPORT_BASELINE`. In CI it looks for a
retained artifact from a previous successful run of the target branch on the
same runner. Missing or pre-upgrade baselines are explicitly reported as
unavailable. Incomplete analyses and different platforms are not compared.
Changes in tools, rules, source, and vulnerability databases can all affect the
observed counts.

The workflow uploads reports even when verification fails. Three-day artifacts
are sufficient for the agreed PoC; a long-term reporting service and its
retention policy remain deployment decisions. No Dependency-Track or SecObserve
integration is claimed.
