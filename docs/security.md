# Security and license checks

Run `mise exec -- task setup` to install the versions in `mise.lock`, restore
dependencies, and install Git hooks. Betterleaks, Syft, Grant, and Grype are
managed by mise; Grant uses the GitHub backend because it has no mise registry
entry.

Opengrep also checks application source for command injection in all seven
languages. See the [source security proof of concept](sast.md) for its rules,
positive and negative fixtures, and OWASP/CWE coverage limits.

| Task                         | Behavior                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `task check:secrets`         | Scan the working tree for secrets with Betterleaks.                                                 |
| `task check:sast`            | Test local Opengrep rules, then fail on matching source vulnerabilities.                            |
| `task check:secrets:history` | Scan all locally available Git history.                                                             |
| `task check:licenses`        | Generate a fresh repository inventory with Syft and warn about Grant policy findings.               |
| `task check:vulnerabilities` | Scan with Grype; fail on High/Critical findings with available fixes, subject to scoped exceptions. |
| `task check:audit`           | On-demand pnpm audit for High/Critical npm vulnerabilities, including dependency paths.             |
| `task check`                 | Run analysis and security checks; formatting and license findings are advisory.                     |
| `task verify`                | Run the same checks and require correct formatting; licenses remain advisory.                       |
| `task maintenance:licenses`  | Refresh the checked-in OSI license policy from SPDX.                                                |
| `task maintenance:deps`      | Update all package.json dependency groups to latest stable releases, including major upgrades.      |
| `task maintenance`           | Update tools, dependencies, and the license policy, then fix and verify.                            |

The pre-commit hook runs `task check`, so secrets and unsuppressed High or
Critical vulnerabilities with published fixes block a commit. License findings
currently warn without blocking. `task fix` fixes formatting and lint issues; it
does not remove secrets, change dependency licenses, or upgrade vulnerable
packages. Run `task verify` afterwards.

## Updating dependencies

`task maintenance:deps` calls `task deps:update`, which runs:

```bash
pnpm update --recursive --include-workspace-root --latest --peer
```

This updates `dependencies`, `devDependencies`, `optionalDependencies`, and
`peerDependencies` in the root and every workspace package, including major
upgrades. pnpm rewrites their manifest ranges and the lockfile. Transitive
packages still follow their parents' declared ranges and existing overrides.
Node and pnpm major versions in `devEngines` stay unchanged. Normal
`task maintenance` includes this update, restores tools and hooks, fixes
formatting, and verifies the result. Review the manifest, lockfile, and
temporary vulnerability exceptions afterwards.

For npm vulnerability details and dependency paths, run these diagnostics
separately:

```bash
mise exec -- task check:audit
mise exec -- pnpm why braces
```

`task check:audit` runs `pnpm audit --audit-level high`, reporting advisories,
affected versions, patched versions, and paths through the dependency tree. It
can exit nonzero even when no fix is published. `pnpm why` shows the complete
reverse dependency tree independently of advisory data. The audit task runs only
when explicitly requested; `check`, `verify`, and `maintenance` do not invoke
it. Grype supplies the gate across ecosystems. Neither an npm override nor
`pnpm audit --fix` can replace a Go module already compiled into a dependency's
binary.

## Secrets

[Betterleaks](https://github.com/betterleaks/betterleaks/tree/v1.x) scans the
working tree, including untracked and Git-ignored files such as `.env`. Its
built-in rules and exclusions apply: dependency directories, many lockfiles, and
binary formats are skipped. Matching secrets are redacted, and live credential
validation is explicitly disabled. Scanning does not contact providers to test
credentials.

History scanning is separate because checking the current tree cannot find a
secret that has already been deleted. The history task scans all local refs; a
shallow clone only contains part of the history. A clean result is limited to
the scanner's detection rules and the files and history available to it.

## License policy

Grant has no native Windows release. `check:licenses` reports that limitation on
Windows; the Linux and macOS CI jobs run the policy. Syft inventory and Grype
vulnerability checks still run on all three platforms.

The policy allows every license ID marked `isOsiApproved` in the
[SPDX License List](https://github.com/spdx/license-list-data). It includes GPL,
AGPL, and other copyleft licenses. `.grant.yaml` records the source and dataset
version, and contains exact IDs rather than wildcard license families. Unknown,
missing, and unlisted licenses are reported as denied. There are no package
exemptions.

Enforcement is temporarily advisory in both `task check` and `task verify`.
`check:licenses` uses Grant's native `--dry-run` option: policy findings remain
visible but return success. Inventory, configuration, and scanner errors still
fail. Remove `--dry-run` and the advisory message in `scripts/check-licenses.sh`
when license enforcement should block again.

Normal checks use the committed policy. `task maintenance:licenses` downloads
the current SPDX list and regenerates it; review and commit the resulting diff.
`task maintenance` also refreshes it. Policy refresh errors fail the task
without replacing the existing policy with an empty or invalid list.

The [Open Source Definition](https://opensource.org/osd) forbids discrimination
against businesses or groups. An annual revenue of roughly 800 million therefore
does not itself exclude a company from using OSI-approved software. License
obligations still apply, including notices, source availability, and copyleft
requirements where relevant. An allowed finding establishes allowlist membership
for a detected license, not compliance with every obligation or compatibility of
licenses in a combined product. An advisory task's successful exit does not mean
that all licenses were allowed.

[Grant](https://oss.anchore.com/docs/guides/license/policies/) currently checks
every detected license, including every alternative in an SPDX `OR` expression.
For example, `MIT OR BUSL-1.1` is denied even though an MIT alternative is
present. `WITH` expressions are also denied unless that exact expression is
allowed. These cases need review; the template does not automatically select
licensing alternatives or approve exceptions. A commercially permissive license
such as `CC0-1.0` is also denied if SPDX does not mark it OSI-approved.

## Vulnerabilities

[Grype](https://github.com/anchore/grype) checks a fresh Syft inventory using
the same `.syft.yaml` coverage settings as the license check. `.grype.yaml` sets
the failure threshold to `high`, which includes Critical vulnerabilities.
`only-fixed: true` limits failures to findings with published fixes.
`show-suppressed: true` keeps findings without fixes visible as advisory
results, with their locations and fix states. Lower severity findings also
remain visible without failing. Grype also treats `wont-fix` and `unknown` fix
states as suppressed under this policy.

Grype knows whether a fix exists for a package; it cannot determine whether a
parent package has shipped a rebuilt binary containing that fix. For these
cases, use a narrow, documented exception tied to the advisory, package version,
and binary location. Review exceptions during maintenance. Transitive
dependencies with available fixes still fail unless an explicit exception
applies.

Grype downloads and caches its vulnerability database, checking for updates
during scans. Its default database integrity and age checks remain enabled;
missing, invalid, or overly old databases and scanner errors fail the task. A
usable cached database can support an offline scan. `task maintenance` updates
Grype through mise and runs the vulnerability check as part of `verify`.

Results depend on the available vulnerability database, package metadata, and
Grype's supported matchers. Unknown versions and unsupported packages cannot be
assumed safe. Review reported packages and upgrade or replace affected
dependencies, then rerun `task check:vulnerabilities`.

The report includes the usual vulnerability table followed by the package's file
locations, using Grype's native template output. Paths refer to the scanned
repository root, including paths to binaries containing embedded dependencies.
An installed package and a lockfile can both provide evidence for the same
finding. Missing locations are reported explicitly.

Grype shows where packages were detected. For npm dependency chains, use
`mise exec -- pnpm why <package>`. For example, `pnpm why braces` traces
`braces` back to `markdownlint-cli2`. If a Go module is embedded in a TypeScript
binary, `pnpm why typescript` traces the package that supplies that binary.
Detailed matching explanations for unsuppressed findings are also available from
Grype's JSON report (replace `VULNERABILITY_ID` with a reported ID):

```bash
grype sbom:/tmp/repository-sbom.json --config .grype.yaml \
  --output json --file /tmp/repository-vulnerabilities.json
grype explain --id VULNERABILITY_ID < /tmp/repository-vulnerabilities.json
```

The scan still exits nonzero for unsuppressed High or Critical findings while
writing its report. Run the explanation separately; its exit status is not the
scan result. Suppressed findings are recorded in the JSON report's
`ignoredMatches` array; their reasons and locations also appear in the normal
task output.

Syft captures Go function symbols from binaries so Grype can refine matches
where the vulnerability data identifies affected functions. When symbols or
function data are unavailable, matching can fall back to package-level
information.

## Inventory coverage

[Syft](https://oss.anchore.com/docs/capabilities/all-packages/) scans `dir:.`
using all non-deprecated catalogers, across every supported ecosystem. Only
`.git` is explicitly excluded. Lockfiles, installed dependencies, development
dependencies, vendored files, generated files, supported binaries, and supported
archives are included. Install dependencies first to make their license files
available.

Registry enrichment is enabled for all supported ecosystems because lockfiles
and embedded binaries often omit license text. This can send dependency names
and versions to upstream registries and download metadata or source archives.
Syft uses its normal local cache. Configure private registry/proxy settings
before scanning private dependencies; an offline scan may fail for missing
metadata. The Go option that executes Go tooling is disabled.

The temporary Syft JSON inventory is created outside the repository, consumed by
Grant or Grype, and removed even when a check fails. For an inspectable report,
keep one outside the scan tree:

```bash
syft scan dir:. --config .syft.yaml -o syft-json=/tmp/repository-sbom.json
grant check --config .grant.yaml /tmp/repository-sbom.json
grype sbom:/tmp/repository-sbom.json --config .grype.yaml
```

This is a package inventory, not a license audit of every source file. Cataloger
support and available metadata determine coverage. Tools installed outside the
repository by mise, remote container contents, undetected packages, and
unsupported files are not covered by this directory scan. Grant may combine
duplicate package records, so its evaluated package count can be lower than
Syft's inventory count.

## Initial findings

The initial scan with the pinned tools reports license policy findings. Syft
cannot find licenses for some TypeScript Go shim modules embedded in installed
binaries or for GitHub Actions and reusable workflows shipped inside
dependencies. Also, `argparse` declares `PSF-2.0`, which the SPDX dataset does
not mark OSI-approved; this is distinct from its approved `Python-2.0` entry.
These findings are not proof that those packages are proprietary or unusable.
They require corrected metadata, different dependencies, or a separately
reviewed policy decision. The template keeps them visible instead of silently
excluding them from the report. These license findings are temporarily advisory.

The initial vulnerability scan reports two High findings. Both are currently
advisory, for different reasons:

- `braces@3.0.3`
  ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) has
  no published fix. `pnpm audit` and `pnpm why` both trace it through
  `markdownlint-cli2`, via `micromatch` and sometimes `globby`/`fast-glob`.
  Grype's fix-availability policy handles this without a package exemption.
- `golang.org/x/text@v0.38.0` ([GO-2026-5970](https://go.dev/issue/80142)) has a
  module-level fix in `v0.39.0`, but is compiled into TypeScript 7.0.2's `tsc`.
  TypeScript 7.0.2 was still the latest stable npm release on 2026-10-04. The
  temporary exception in `.grype.yaml` matches only this advisory, module
  version, and binary path inside TypeScript 7.0.2. It does not match a
  standalone Go dependency, another binary, or a different TypeScript version.
  Remove the exception after updating to a release containing the fix.

Results can change when dependencies or the vulnerability database change. A
successful scan with suppressed findings means the configured gate passed, not
that the repository has no known vulnerabilities.
