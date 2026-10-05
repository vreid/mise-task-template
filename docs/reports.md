# Analysis reports

`task check` and `task verify` write machine-readable reports to the Git-ignored
`reports/` folder at the repository root. Every run regenerates them; they are
never committed. CI uploads the folder as an artifact named after the analyzed
commit and platform, kept for three days.

| File                   | Written by              | Content                                                                     |
| ---------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `manifest.json`        | `check:manifest`        | Analyzed commit, uncommitted-changes flag, timestamp, and platform          |
| `findings.json`        | `check:findings`        | Every finding below, classified high, medium, or low, with accepted reasons |
| `sbom.cdx.json`        | `check:sbom`            | CycloneDX JSON SBOM of the repository inventory                             |
| `sbom.spdx.json`       | `check:sbom`            | SPDX JSON SBOM of the same inventory                                        |
| `sbom.syft.json`       | `check:sbom`            | Syft's lossless inventory, which Grant and Grype evaluate                   |
| `vulnerabilities.json` | `check:vulnerabilities` | Grype matches, including accepted ones and their reasons                    |
| `licenses.json`        | `check:licenses`        | Grant's decision for every package (Linux and macOS)                        |
| `sast.json`            | `check:sast`            | Opengrep findings; `sast-modules.json` covers `.mts` and `.cts` files       |
| `secrets.json`         | `check:secrets`         | Betterleaks findings, redacted; `secrets-history.json` covers Git history   |
| `suppressions.json`    | `check:suppressions`    | Every inline suppression with its rules, reason, and commit                 |
| `complexity.csv`       | `check:lizard`          | NLOC, cyclomatic complexity (CCN), tokens, parameters, length per function  |
| `sloc.json`            | `check:scc`             | Files, lines, and code lines per language and file                          |
| `sloc-diff.md`         | `check:sloc-diff`       | Code lines per language compared with a target branch                       |

## Commit identity

Every report belongs to the commit in `manifest.json`, which is independent of
any release version scheme; `mise.lock` and the lockfiles at that commit pin the
tools that produced them. The manifest also records whether the working tree had
uncommitted changes. The SBOM uses the same commit as its version, with `-dirty`
for uncommitted changes, unless release tooling sets `REPORT_NAME` and
`REPORT_VERSION`. The suppression register and the findings report repeat the
commit.

## Upload

Each CI job uploads `reports/` as `reports-<commit>-<runner>`, even when
verification fails, and keeps it for three days. That demonstrates that the
reports leave the runner. Long-term storage, a findings platform, or a component
analysis service such as Dependency-Track is not chosen yet; pushing to one
would replace or follow the artifact upload.

## Classification

`findings.json` lists every finding from the report files above with a
`severity` of high, medium, or low. Grype, Opengrep, and any other tool with its
own severity keep it: critical and high (or `ERROR`) become high, medium (or
`WARNING`) becomes medium, and everything else low. Findings from tools without
a severity are low: Betterleaks, Grant, and suppression register problems. Each
entry also keeps the tool's own severity as `native`, and a `state` of `open` or
`accepted`; accepted findings carry the reason from `.grype.yaml`.

Lint, compiler, and complexity findings fail the build before they could be
archived as open findings, so they are low by the same rule but do not appear in
`findings.json`. The findings report is written last, even when a check fails,
so a failed run keeps the findings it reached.

## SBOM scope

The SBOM describes the same full-repository inventory that the license and
vulnerability checks evaluate, from a single Syft scan. It includes the example
applications, their lockfiles and build outputs, and the restored development
dependencies and tool binaries in the working tree. It is therefore a
development and supply-chain inventory, not the release SBOM of a single shipped
product; a product release would scan its release artifact with the same
configuration. Tools that mise installs outside the repository are not included.
See [inventory coverage](security.md#inventory-coverage).

Syft excludes `reports/` and the linter fixtures, so an earlier SBOM never feeds
into the next inventory. File metadata cataloging is disabled: Syft's CycloneDX
output would otherwise list package evidence files under absolute host paths,
exposing local directory names. The Syft JSON records Syft's effective
configuration, which includes local cache paths, so hand the CycloneDX or SPDX
file to other systems.

Reports are generated before the secret scan, so Betterleaks also checks the
files that are meant to leave the repository.

## Complexity and size

`complexity.csv` lists every function, and the top-level code of each file, in
every language Lizard supports here, including those within the limits. Its
header names the columns; `location` combines function, line range, and file.
The file is written before the limit check runs, so it exists even when the
check fails.

`sloc-diff.md` compares code lines per language between a target branch and the
working tree, using the same scc settings and ignore files on both sides. On
every pull request, CI posts it as a comment, comparing with the pull request's
target branch as it stands, and updates the comment on later pushes. Run it
locally with `task check:sloc-diff BASE=origin/main`. See
[code metrics](code-metrics.md).

## Not implemented yet

- A receiving system that keeps reports longer than the three-day artifact.
- Trends across runs, which need that system.
