# Code metrics

`task check:metrics` runs scc and Lizard. Both `task check` and `task verify`
include it, so pre-commit and maintenance use the same policy.

| Task            | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| `check:scc`     | Report size and estimated complexity, sorted within each language. |
| `check:lizard`  | Write per-function metrics, then fail when a limit is exceeded.    |
| `check:metrics` | Run both tools.                                                    |

## Required limits

Lizard checks every supported source file selected by Git, including untracked
files, tests, and repository helpers. The limits are in
`scripts/check-complexity.sh`:

| Metric                        | Maximum | Intent                                                                |
| ----------------------------- | ------- | --------------------------------------------------------------------- |
| Cyclomatic complexity (CCN)   | 10      | Keep the number of independent execution paths manageable.            |
| Non-comment code lines (NLOC) | 60      | Keep functions small without penalizing documentation or blank lines. |
| Parameters                    | 5       | Flag functions with too many separate inputs.                         |

Exactly meeting a limit is allowed; exceeding any limit fails. The native
1,000-line physical-length backstop is also set explicitly. Zero violations are
allowed. Lizard prints the file, line, function, and measured values when
something exceeds a limit. Fixing these findings requires a reviewed refactor;
there is no automatic complexity fix.

Before checking the limits, Lizard writes every function's NLOC, cyclomatic
complexity, token count, parameter count, and length to
`reports/complexity.csv`, including functions within the limits. The report
exists even when the check fails, and the console prints the function count and
highest CCN. See [analysis reports](reports.md).

The `outside` extension also measures code outside named functions, covering
top-level script logic. It may label that code `*global*`. Its NLOC count also
includes top-level declarations and data, and physical length can span a file.
Nesting extensions are not hard gates: Lizard 1.24's `NS` miscounts the Python
example, and `ND` treats flat, unbraced guard clauses as increasing nesting.
Cyclomatic complexity still catches excessive branching without those false
positives. Cognitive complexity is not available in this release. Duplication
checks are also omitted: the examples intentionally demonstrate equivalent
algorithms in different languages.

The small Python adapter registers `.mts` and `.cts` with Lizard's existing
TypeScript reader. Lizard 1.24 otherwise skips these suffixes during discovery.
It runs with the interpreter from Lizard's isolated tool environment, found
through the `pyvenv.cfg` beside mise's Lizard launcher: on Unix the launcher is
a symlink into that environment, on Windows a standalone copy. Source paths and
line numbers remain intact; sources are neither renamed nor rewritten.

File discovery respects Git's nested ignores, excludes symlinks and deleted
files, and includes tracked files even if subsequently ignored. Supplying
explicit paths also prevents Lizard from silently deduplicating identical source
files. Its available parsers determine language coverage, including all seven
example languages. Bash is covered by ShellCheck and scc, not Lizard.

Prefer splitting responsibilities, using guard clauses, or simplifying input
types when a limit is exceeded. Where a metric misrepresents necessary code,
Lizard supports a local `#lizard forgives(metric) -- reason` comment;
`check:suppressions` rejects forgiveness without a metric or reason and records
it. In `#`-comment languages such as Python, Lizard forgives the whole function
even when a metric is named. Avoid blanket test exclusions or raising the
repository limit to accommodate one function. No exceptions are currently
configured. See [suppressions](suppressions.md).

These are maintainability signals. Lizard uses partial parsers, does not expand
C/C++ macros, and can misinterpret complex syntax. Syntax and semantic checks
remain the responsibility of the existing compilers and linters. See
[Lizard's options and limitations](https://github.com/terryyin/lizard).

## Repository report

`check:scc` also writes the counts to `reports/sloc.json`. `check:sloc-diff`
compares code lines per language with a target branch using the current working
tree's root and nested ignore policy on both snapshots. CI posts that comparison
on every pull request; see [analysis reports](reports.md).

scc reports per-language and per-file code size and estimated complexity,
including languages and configuration formats beyond Lizard's coverage. Files
are ordered by estimated complexity within each language so likely review
candidates appear first. The Git ignore rules exclude dependencies and build
outputs. `.sccignore` additionally excludes generated policy inventories and
dependency metadata. Duplicate source files remain visible.

The scc report is advisory. Its file-level score is an approximation whose scale
differs between languages; a single cross-language pass/fail threshold would be
misleading. There is no cap on total repository size and no comment-ratio,
cost-estimate, or repeated-line percentage gate. Function-level limits come from
Lizard instead. See
[scc's complexity explanation](https://github.com/boyter/scc#complexity-estimates).

## Installation and updates

mise installs scc from its upstream GitHub release and Lizard from PyPI using
uv. Neither has a supported idiomatic version file here, so their selectors live
in `mise.toml`. Python continues to come from `.python-version` through
`idiomatic_version_file_enable_tools`.

`mise.lock` pins the selected releases. Lizard's full dependency graph, wheel
hashes, and Python-version markers live in mise's generated
`.mise/locks/pypi-lizard/<version>/` directory. Commit that directory together
with `mise.lock`; a locked setup needs both. It is generated metadata, not a
Python application project or a second manually maintained version source.

`task setup` restores the pinned tools. `task maintenance` refreshes the tool
versions and Lizard's dependency lock, then checks the configured limits.
`task doctor` prints scc, Lizard, and uv versions. Review measurement changes
when upgrading tools. See
[mise's PyPI dependency locking](https://mise.jdx.dev/dev-tools/backends/pipx.html#dependency-locking).
