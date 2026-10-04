# Analysis reports

`task check` and `task verify` write machine-readable reports to the Git-ignored
`reports/` folder at the repository root. Every run regenerates them; they are
never committed.

| File                | Written by           | Content                                                                    |
| ------------------- | -------------------- | -------------------------------------------------------------------------- |
| `sbom.cdx.json`     | `check:sbom`         | CycloneDX JSON SBOM of the repository inventory                            |
| `sbom.spdx.json`    | `check:sbom`         | SPDX JSON SBOM of the same inventory                                       |
| `sbom.syft.json`    | `check:sbom`         | Syft's lossless inventory, which Grant and Grype evaluate                  |
| `complexity.csv`    | `check:lizard`       | NLOC, cyclomatic complexity (CCN), tokens, parameters, length per function |
| `suppressions.json` | `check:suppressions` | Every inline suppression with its rules, reason, and Git attribution       |

## Assumption: another system ingests the reports

This repository only generates reports. It assumes that a later pipeline step,
outside this repository, collects `reports/` after `task verify` and pushes the
files to the systems that store, track, and present them:

- The CycloneDX SBOM goes to a component analysis platform. Dependency-Track is
  the assumed destination: it tracks components per project version and
  re-evaluates them as vulnerability data changes.
- The complexity report and suppression register go to archival storage that
  keeps them for each analyzed version.

Nothing here implements that step. There is no upload task, endpoint,
credential, project mapping, or retention policy. In CI, the reports exist only
in the runner's workspace until the job ends; the workflow does not upload them
as artifacts. Whoever adds the push step must also decide which version label
the receiving system uses.

## Names and versions

The SBOM identifies the analyzed source by name and version. Release tooling can
set both through `REPORT_NAME` and `REPORT_VERSION`. Otherwise the name is the
checkout directory, and the version is `git describe --tags --always --dirty`:
the nearest tag with the abbreviated commit, or the commit alone, plus `-dirty`
when the working tree has uncommitted changes. The suppression register records
the full analyzed commit as `revision`.

## SBOM scope

The SBOM describes the same full-repository inventory that the license and
vulnerability checks evaluate, from a single Syft scan. It includes the example
applications, their lockfiles and build outputs, and the restored development
dependencies and tool binaries in the working tree. It is therefore a
development and supply-chain inventory, not the release SBOM of a single shipped
product; a product release would scan its release artifact with the same
configuration. Tools that mise installs outside the repository are not included.
See [inventory coverage](security.md#inventory-coverage).

Syft excludes `reports/`, so an earlier SBOM never feeds into the next
inventory. File metadata cataloging is disabled: Syft's CycloneDX output would
otherwise list package evidence files under absolute host paths, exposing local
directory names. The Syft JSON records Syft's effective configuration, which
includes local cache paths, so hand the CycloneDX or SPDX file to other systems.

Reports are generated before the secret scan, so Betterleaks also checks the
files that are meant to leave the repository.

## Complexity report

`complexity.csv` lists every function, and the top-level code of each file, in
every language Lizard supports here, including those within the limits. Its
header names the columns; `location` combines function, line range, and file.
The file is written before the limit check runs, so it exists even when the
check fails. See [code metrics](code-metrics.md).

## Not implemented yet

- Pushing reports to the assumed systems, as described above.
- Keeping reports after a CI run.
- A manifest that ties every report to the analyzed commit, tool versions,
  timestamp, and platform. The SBOM carries a name and version label, and only
  the suppression register records the full commit.
- Reports for lint, SAST, secret, license, and vulnerability findings, whose
  results remain console output.
- Trends across runs.
