# Suppressions and accepted findings

An inline suppression is allowed when it names the specific rule it disables and
states why. `task check:suppressions` enforces both for every tool in this
template and records each suppression in `reports/suppressions.json`. `check`
and `verify` run it, so the pre-commit hook and CI reject suppressions without a
rule or a reason.

## Accepted forms

| Tool          | Form                                                                                |
| ------------- | ----------------------------------------------------------------------------------- |
| Opengrep      | `nosemgrep: <rule-id> -- <reason>`                                                  |
| Ruff          | `# noqa: <code> -- <reason>`                                                        |
| oxlint        | `oxlint-disable-next-line <rule> -- <reason>`, also `-line` and `eslint-` prefixes  |
| TypeScript    | `@ts-expect-error -- <reason>`; `@ts-ignore` and `@ts-nocheck` are rejected         |
| golangci-lint | `//nolint:<linter> // <reason>`                                                     |
| Rust          | `#[expect(<lint>, reason = "<reason>")]`, or `#[allow(...)]` with `reason`          |
| C#            | `#pragma warning disable <id> // <reason>`, or `SuppressMessage` with Justification |
| clang-tidy    | `// NOLINT(<check>) -- <reason>`, also `NOLINTNEXTLINE` and `NOLINTBEGIN`           |
| Clang         | `#pragma clang diagnostic ignored "-W<warning>" // <reason>`                        |
| Clang         | `#pragma clang unsafe_buffer_usage begin // <reason>`                               |
| ShellCheck    | `# shellcheck disable=SC<code> # <reason>`                                          |
| markdownlint  | `markdownlint-disable-next-line <rule> -- <reason>`, inside an HTML comment         |
| Lizard        | `#lizard forgives(<metric>) -- <reason>`, or `#lizard forgive global -- <reason>`   |
| Betterleaks   | a fingerprint in `.betterleaksignore` with a `# <reason>` line directly above       |

The separators follow each tool's own parser: ShellCheck rejects `--` in its
directives, so it uses `#`. TypeScript cannot name the error it suppresses, so
only the reason is required.

When the directive itself carries no reason, the comment lines directly above it
count as the reason. This suits explanations that need more than one line:

```c
// argc == 2 guarantees argv[1] is a valid, NUL-terminated argument.
#pragma clang unsafe_buffer_usage begin
```

golangci-lint, Rust attributes, and C# `SuppressMessage` accept only their own
reason fields, because their native checks look there: `nolintlint`, Clippy's
`allow_attributes_without_reason`, and the attribute's `Justification`.

Blanket forms are rejected: directives without rules, golangci-lint's `all`,
wildcards in clang-tidy checks, Clippy and compiler lint groups such as
`clippy::all` and `warnings`, and `-Weverything`, `-Wall`, or `-Wextra`. In
`#`-comment languages such as Python, Lizard forgives a whole function even when
a metric is named.

## Detection

The register scans every file Git selects, including untracked files, with the
same ignores as the other checks. It reports Opengrep and clang-tidy markers
anywhere on a line, not only in comments, because those tools honor them there:
a string literal containing the Opengrep marker silences findings on its line.

Each entry is printed as `file:line: tool: problem`. The register is written
even when it reports problems, so a failed run keeps its evidence.

## Register

`reports/suppressions.json` records the analyzed commit as `revision`. For each
suppression it records the tool, file, line, rules, reason, problems, and the
commit, author, and date that last changed the line according to `git blame`.
Lines without a commit yet have null attribution. CI checks out full history, so
attribution is exact there. See [analysis reports](reports.md) for how reports
are expected to leave the repository.

## Accepting secret findings

Betterleaks runs with `--ignore-gitleaks-allow`, so inline allow comments have
no effect. To accept a finding, for example a revoked test credential that
remains in history, add its fingerprint from a Betterleaks report to
`.betterleaksignore`, with a comment line explaining the decision directly above
it:

```text
# Revoked 2026-10-04: placeholder token from the old test fixtures.
src/config.ts:github-pat:12
```

Rotate real secrets first. Accepting a finding does not remove the secret from
history.

## Exemptions in configuration

Some exemptions live in versioned configuration instead of source comments. Git
history and code review record them: Grype `ignore` rules with a `reason` in
`.grype.yaml`, Ruff's `per-file-ignores`, the explicit check lists in
`.clang-tidy` and `.golangci.yml`, `.editorconfig` severities, `.semgrepignore`,
and the Syft exclusions. The register does not list them.

## Maintenance

`scripts/suppression-directives.json` defines each tool's markers and accepted
forms. `task test:suppressions` runs the register in a temporary Git repository
against valid and invalid directives for every tool, kept as data in
`scripts/suppressions.test.json`. Update both when adding a tool, and recheck
the forms when a tool upgrade changes its directive syntax.
