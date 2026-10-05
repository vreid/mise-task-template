# Baseline for existing projects

A project that adopts these checks late usually starts with findings nobody can
fix at once. `task check:new` demonstrates the common answer: tolerate what was
already there and fail on what a branch adds.

```bash
mise exec -- task check:new              # compare with origin/main
mise exec -- task check:new BASE=release # or any other branch or commit
```

The task finds the merge base of `BASE` and `HEAD` and fails only on findings
that the commits since then introduce. Commit or stash tracked changes first;
the task stops with status 2 otherwise, because Opengrep compares commits.

| Tool          | Native mechanism                         | Result                                        |
| ------------- | ---------------------------------------- | --------------------------------------------- |
| Opengrep      | `--baseline-commit <merge base>`         | `reports/new/sast*.json`, new findings only   |
| golangci-lint | `--new-from-merge-base <BASE>`           | Terminal output, issues in changed lines only |
| Betterleaks   | Git scan of `<merge base>..HEAD` commits | `reports/new/secrets.json`                    |

`task test:baseline` builds a temporary repository whose `main` branch already
has an Opengrep finding and golangci-lint issues, and confirms that a full scan
reports them. It then confirms that `check:new` passes on a branch that adds no
findings and fails on a new Opengrep finding in Python and in a TypeScript
module, a new Go issue, and a committed secret, and that only the new finding is
reported. The Opengrep part reuses `scripts/check-sast.sh`, so `.mts` files are
scanned as in `task check`. With the baseline options removed from the script,
the tests fail.

## What this does not decide

This is a demonstration, not the policy for any particular project. `task check`
and `task verify` still evaluate the whole repository, and CI still runs
`verify`. Before adopting a baseline, a project has to choose:

- which tools to baseline. Ruff, Clippy, Oxlint, clang-tidy, the .NET analyzers,
  ShellCheck, and markdownlint have no native new-findings mode. Their usual
  options are a recorded list of existing findings (for example Ruff's
  `--add-noqa`, which adds suppressions that the
  [suppression register](suppressions.md) would then require reasons for), a
  diff filter, or fixing everything first;
- whether the baseline is the merge base, a fixed commit, or a recorded findings
  file, and who may move it;
- how the existing findings are tracked and reduced, so the baseline does not
  become permanent;
- whether changed lines or changed files count as new. golangci-lint reports
  issues in changed lines; Opengrep compares findings by rule and code.

The dependency, license, complexity, and suppression checks report the state of
the whole repository by design and are not baselined here.
