# Python checks

[Ruff](https://docs.astral.sh/ruff/) lints and formats standalone Python files.
It does not require a Python project, `pyproject.toml`, virtual environment, or
installed Python interpreter. mise installs its standalone binary, with the
version pinned in `mise.lock`; setup and maintenance manage it like the other
tools. The runnable example separately uses Python from `.python-version` and
`mise.lock`, with standard-library doc tests and no third-party dependencies.

| Task                | Behavior                                                                  |
| ------------------- | ------------------------------------------------------------------------- |
| `task check:python` | Run strict Ruff lint checks.                                              |
| `task check:fmt`    | Report formatting differences, including Python, without failing on them. |
| `task verify:fmt`   | Require correct formatting, including Python.                             |
| `task fmt:python`   | Format Python files and code examples in docstrings.                      |
| `task fix:python`   | Apply safe lint fixes; fail on remaining lint errors.                     |

`task check` and `task verify` both include Python linting. Formatting
differences are advisory in `check` and mandatory in `verify`; syntax,
configuration, and lint errors fail both. `task fmt` formats Python, and
`task fix` applies safe fixes and formats again. The existing pre-commit hook
and maintenance flow inherit these checks.

## Strict configuration

`.ruff.toml` enables all stable lint rules, including security checks, import
sorting, type annotation requirements, unused suppression checks, copyright
notices, and docstrings using the Google convention. Preview rules are not
enabled. Formatter-conflicting rules are disabled, and the formatter owns line
wrapping. Standalone scripts are allowed without `__init__.py`. There are no
blanket exceptions for tests or notebooks. New stable rules can become active
when maintenance updates Ruff.

Formatting uses four-space indentation, LF endings, and an 80-character target.
Ruff may leave an unbreakable line longer than the target. Automatic lint fixes
are limited to Ruff's safe fixes. Ruff checks annotation style and presence, but
it is not a Python type checker and does not run the code.

No Python target version is pinned here; Ruff currently defaults to Python 3.10
when no project metadata supplies one. Set `target-version` in `.ruff.toml` when
the repository chooses a Python runtime baseline. That setting controls analysis
and rewrites; it does not install Python.

## File coverage

Tasks pass `.ruff.toml` explicitly so its policy applies across the repository.
Ruff recursively discovers `.py`, `.pyi`, and Python Jupyter notebook `.ipynb`
files; `.pyw` discovery is also enabled. It can check supported `pyproject.toml`
metadata when one is added, without requiring one now. Empty repositories
succeed.

Ruff respects Git ignore rules and its standard exclusions, including
`node_modules`, virtual environments, caches, and `dist`. The template
explicitly excludes `build` and `coverage`. Markdown formatting stays with
Oxfmt. This scans repository source rather than installed third-party Python
packages. The local `.ruff_cache` is ignored by Git.

Extensionless Python scripts are not discovered automatically. Give them a `.py`
extension, configure additional filename patterns, or check them explicitly:

```bash
mise exec -- ruff check --config .ruff.toml path/to/script
```
