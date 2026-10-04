# Security spend: AI coding harness vs. GHAS

For this template, the cheapest large improvement is a strong AI model in an
agentic coding harness, on top of the free scanners already configured, rather
than a GitHub Advanced Security (GHAS) license. Scanners produce candidates. The
expensive part is deciding which findings matter and fixing them, and that is
the work the harness does. Prices are as of 2026-10-04.

A coding harness here means a model that works inside the repository: it reads
code, runs scanners and tests, changes files, and verifies the result in CI.
Claude Code did the work described below; GitHub Copilot's agent mode is another
option.

## Findings are cheap; decisions are not

The template already runs free scanners for lint, SAST, secrets, dependency
CVEs, and metrics. Every finding still needs a decision: is it real, can it be
reached, and should it be fixed or accepted? Findings nobody decides on become
noise, and developers learn to ignore the scanner. Buying more detection adds
findings, not decisions.

## Example: a High CVE that is no risk here

`braces@3.0.3` carries the High advisory GHSA-vfj7-8cjw-p6xm. Any dependency
scanner that uses this advisory, Dependabot included, raises the same alert.

| Question | Scanner output                                           | After triage                                                                  |
| -------- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Severity | High, EPSS 0.7%                                          | Not exploitable in this repository                                            |
| Path     | `braces@3.0.3` in `node_modules` and the lockfile        | Only through `markdownlint-cli2`, via `globby`, `fast-glob`, and `micromatch` |
| Fix      | None; every version up to 3.0.3 is affected              | Nothing to upgrade to                                                         |
| Attack   | Deeply nested glob patterns exhaust the stack            | Patterns come only from repository configuration; worst case: a failed lint   |
| Outcome  | An alert that blocks merges or that people learn to skip | An acceptance with that reason in `.grype.yaml`, ending when a fix ships      |

The harness traced the dependency path, read the advisory, and tested the policy
before proposing it. Without the acceptance, the gate fails. With it, the gate
passes and prints the reason, and the rule stops applying once a fix exists.

## Example: seven "High" CVEs that were artifacts

The Windows CI job reported seven High Go standard library advisories in
TypeScript's `tsc.exe`. Syft records no Go symbols for Windows binaries, so
Grype matched by module. Linux and macOS match the same release by function and
report none of them. The harness reproduced the result on macOS by downloading
the Windows binary, checked each advisory, and found none specific to Windows.
It then scoped seven exceptions to exactly that binary and version.

## What the harness did that a license does not

Between 22:10 and 23:25 on 2026-10-04, the work produced 13 commits across 30
files (`2bcf6d4` to `1333e26`), and the result passed CI on Linux, Windows, and
macOS:

- **It attacked the tooling.** The command-injection rule caught 0 of 14
  textbook variants, and 9 also passed every linter. A bare suppression comment,
  even inside a string literal, silenced the SAST scan. A five-line
  `.gitleaks.toml` silenced the secret scan. A secret committed and deleted in
  the next commit passed CI.
- **It fixed root causes.** The Windows job had never passed. Four separate
  causes were found and fixed, one with narrowly scoped exceptions.
- **It built missing requirements:** SBOM generation, a per-function complexity
  report, a register that requires a rule and a reason for every suppression, a
  secret history scan, and an explicit CVE acceptance policy. The register has
  its own tests; each other change was checked against a reproduction of the
  problem it fixes.

No scanner license finds holes in your own scanner setup or fixes your CI. That
takes someone who reads, runs, and verifies, at the cost of a seat.

## What GHAS does better

- **Push protection** blocks a secret before it reaches GitHub. This repository
  catches secrets in a pre-commit hook, which can be bypassed, and in CI, after
  the push.
- **CodeQL** performs deeper data-flow analysis than the single Opengrep rule
  here, for all seven example languages. Its default threat model treats only
  remote input as untrusted. Environment variables and arguments count only with
  the local threat model, in preview for Java/Kotlin and C#. Coverage still has
  to be configured and verified.
- **Findings management** tracks alert states, dismissal reasons, trends, and
  merge blocking on results. That covers open requirements such as observable
  results and trends. A self-hosted platform such as SecObserve or
  Dependency-Track can cover them as well.
- **Copilot Autofix** proposes fixes for CodeQL alerts in JavaScript,
  TypeScript, Java, and Python. GHAS itself relies on AI for the fixing step.

Public repositories get CodeQL, Copilot Autofix, secret scanning, and push
protection free. CodeQL's license forbids analyzing private code without a paid
GHAS license, so on company repositories CodeQL is not free.

## Cost

| Product                                           | Price (USD per month)   | Billed per                                   |
| ------------------------------------------------- | ----------------------- | -------------------------------------------- |
| GitHub Secret Protection                          | 19                      | active committer, pushed in the last 90 days |
| GitHub Code Security                              | 30                      | active committer, pushed in the last 90 days |
| Claude Team, standard seat (includes Claude Code) | 20 annual, 25 monthly   | seat                                         |
| Claude Team, premium seat                         | 100 annual, 125 monthly | seat                                         |
| GitHub Copilot Business                           | 19                      | granted seat                                 |
| GitHub Copilot Enterprise                         | 39                      | granted seat                                 |

Assume 50 active committers. Both GHAS products then cost $2,450 a month, or
$29,400 a year. Five premium Claude seats for the people who own triage and this
template cost $500 a month on annual billing. A standard seat for all 50
developers costs $1,000 a month on the same terms, and those seats also serve
everyday development, not only security. GHAS scales with every committer;
triage scales with the people who do it.

## Risks of the AI route

- **Models can be confidently wrong.** Accept no claim without a reproduction
  and a control, as in the examples above. Record each decision with its reason
  in versioned configuration.
- **A model is not a gate.** The deterministic scanners and the suppression
  register stay the merge gates. The harness proposes, explains, and fixes.
- **Source code reaches the model provider.** Use business terms with a data
  processing agreement and no training on your data, and check internal policy
  first.
- **Usage limits and prices change.** Review seats and limits like any other
  subscription.

## Recommendation

1. Keep the free scanners as deterministic gates, as configured here.
2. Give the people who own triage and this template a strong model in an agentic
   harness. For one quarter, track the time from finding to decision, findings
   fixed or accepted with a reason, and findings left undecided.
3. Buy GHAS only for a specific gap: Secret Protection if secrets reaching
   GitHub is the main risk, Code Security if CodeQL's depth on private code
   proves worth $30 per committer.
4. On public repositories, turn on the free GHAS features anyway.

## Sources

- [GitHub security plans and prices](https://github.com/security/plans)
- [GHAS billing and active committers](https://docs.github.com/en/billing/concepts/product-billing/github-advanced-security)
- [CodeQL supported languages](https://codeql.github.com/docs/codeql-overview/supported-languages-and-frameworks/)
- [CodeQL threat models](https://docs.github.com/en/code-security/reference/code-scanning/workflow-configuration-options)
- [CodeQL CLI license](https://github.com/github/codeql-cli-binaries/blob/main/LICENSE.md)
- [Claude plans](https://claude.com/pricing)
- [GitHub Copilot plans](https://docs.github.com/en/copilot/get-started/plans)
- [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- In this repository: [security checks](security.md),
  [suppressions](suppressions.md), and the
  [requirements handover](requirements-handover.md)
