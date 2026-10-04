# C and C++ checks

The existing mise LLVM installation supplies Clang, clang-tidy, clang-format,
and llvm-symbolizer. No additional package manager or build system is needed for
these small examples. C targets C17; C++ targets C++20. Task supplies the macOS
SDK through `SDKROOT`.

| Task                         | Behavior                                                       |
| ---------------------------- | -------------------------------------------------------------- |
| `check:c`, `check:cpp`       | Show compiler warnings; require clang-tidy checks.             |
| `verify:c`, `verify:cpp`     | Require adopted compiler diagnostics and clang-tidy.           |
| `fmt:c-cpp`                  | Format repository C/C++ sources and headers.                   |
| `fix:c`, `fix:cpp`           | Apply clang-tidy fix-its, recheck, and format.                 |
| `test:c`, `test:cpp`         | Compile and run unit tests with ASan and UBSan.                |
| `test:tooling`               | Exercise the compiler warning policy with real Clang fixtures. |
| `maintenance:clang-warnings` | Explicitly adopt the installed compiler's warning IDs.         |

The main `check`, `verify`, `fmt`, `fix`, and `test` tasks include these scoped
tasks. Builds and runs keep compiler warnings advisory; verification enforces
the frozen policy. The full maintenance flow updates tools, fixes, and verifies
without automatically expanding the required diagnostic policy.

## Compiler diagnostics

Compilation enables `-Weverything`, including diagnostics outside `-Wall` and
`-Wextra`. Compatibility warnings for C before C99 and C++ before C++20 are
disabled because the examples intentionally use their selected language
standards. System headers retain Clang's normal treatment.

`verify` compiles every source and test translation unit with `-Werror` and code
generation enabled. `.clang-warnings.json` records all warning IDs known to the
compiler when the policy was adopted, rather than just warnings found in the
current source. An existing ID fails verification. A new ID remains visible and
advisory until explicitly adopted, even when Clang adds it to an existing
warning group.

Clang cannot express that distinction with warning flags alone. The small
`scripts/clang-warnings.mts` adapter uses symbolic diagnostic IDs from SARIF.
When a strict compile fails, it recompiles without warning promotion to separate
actual errors from warnings, classifies the warnings, and prints Clang's native
source diagnostics. Syntax, compiler, and report-parsing errors still fail.
Numeric-only or malformed diagnostic reports are rejected. The installed LLVM 23
supports the required symbolic IDs; the real-compiler tests exercise the strict
and advisory paths.

The policy freezes diagnostic identities, not compiler implementation.
Improvements to an already-adopted diagnostic and actual compilation errors can
still require source fixes after an upgrade. LLVM itself remains pinned by
`mise.lock`. Clang's SARIF interface is experimental, so changes to its format
may require updating the adapter. See the
[Clang warning controls](https://clang.llvm.org/docs/UsersManual.html#options-to-control-error-and-warning-messages)
and [diagtool](https://clang.llvm.org/docs/CommandGuide/diagtool.html).

After reviewing new warnings, run `task maintenance:clang-warnings`, inspect the
policy diff, and run `task verify`. This adopts the compiler's complete current
warning inventory, including warnings that the examples do not yet exercise. It
does not change the separate clang-tidy selection.

Unsafe-buffer diagnostics remain enabled. C's NUL-terminated string traversal,
bounded test-array iteration, and validated `argv` access have narrow
`#pragma clang unsafe_buffer_usage` regions with their safety contracts stated
in comments. `check:suppressions` requires that reason and records each region.
C++ converts `argv` to a span at the validated boundary and uses bounded
containers, string views, and range iteration elsewhere. These local exceptions
do not disable sanitizer instrumentation.

Both C++ entry points catch every exception in a function-try-block and return
1, like other output failures. On Windows, clang-tidy follows the MSVC standard
library's stream code into paths that can throw, and `bugprone-exception-escape`
requires `main` not to let them escape.

## clang-tidy

`.clang-tidy` explicitly lists the selected checks so an LLVM upgrade does not
silently enable new checks. The initial selection covers the available bugprone,
Clang static analyzer, CERT, C++ Core Guidelines, miscellaneous, modernization,
performance, portability, and readability families. Existing checks may still
improve with a tool upgrade.

Three checks are omitted with reasons in the configuration: mandatory trailing
return types are a style preference, the optional Annex K `*_s` APIs are not
available on macOS, and trailing-comma layout belongs to the formatter. Other
unsafe-API and buffer checks remain enabled. Lint findings fail both `check` and
`verify`; compiler warnings are handled separately by the policy above. Project
headers are included in analysis, while system-header findings are excluded.

`scripts/c-cpp.sh` shares the actual language and compiler flags with clang-tidy
using its fixed compilation database (`--` arguments). It checks all source and
test translation units in each example. Add new projects explicitly; if their
build flags differ per source, introduce a generated `compile_commands.json`
instead of maintaining a second set of analyzer flags. Build and test entry
points currently list the shared word-count implementation explicitly.

Fix tasks use native fix-its without `--fix-errors`, then recheck remaining
findings and apply formatting. Review the resulting source changes: clang-tidy
does not classify all fixes as semantically safe. See the
[clang-tidy documentation](https://clang.llvm.org/extra/clang-tidy/).

## Formatting

`.clang-format` starts with `BasedOnStyle: LLVM`, an 80-column target, and LF
endings. The root EditorConfig agrees with LLVM's two-space indentation for
C/C++. The formatter discovers tracked and untracked C/C++ sources, headers, and
inline implementation files through Git, respecting ignores for untracked files.

Formatting differences are advisory in `check:fmt` and fail `verify:fmt`.
Configuration errors, incomplete formatting, and tool failures fail both.
`fmt:c-cpp` applies formatting; the main `fmt` and `fix` tasks include it.

## Runtime checks

Every C/C++ unit-test build instruments both the word-count implementation and
test code with AddressSanitizer and UndefinedBehaviorSanitizer. These binaries
live in `build/c/sanitized` and `build/cpp/sanitized`, separate from the normal
CLI builds. Debug information, modest optimization, frame pointers, and unmerged
sanitizer checks preserve useful stack traces. llvm-symbolizer comes from the
same mise installation.

ASan also enables stack-use-after-scope and always-on stack-use-after-return
instrumentation. UBSan uses the `undefined` group. Recovery is disabled, so a
finding terminates the test and fails the task. Task enables UBSan stack traces.
On Windows, the test executables load Clang's dynamic sanitizer runtime, so the
test helper adds the compiler's runtime directory to `PATH`. Only executed code
is covered; these checks complement static analysis rather than prove memory
safety. See [ASan](https://clang.llvm.org/docs/AddressSanitizer.html) and
[UBSan](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html).

MSan is deferred. It does not support this macOS environment, must run
separately from ASan, and needs instrumented dependencies, including the C++
standard library. A future supported Linux setup should supply that complete
environment before claiming uninitialized-read coverage. See
[MSan requirements](https://clang.llvm.org/docs/MemorySanitizer.html).

Valgrind is also deferred: its supported platforms do not include macOS on Apple
Silicon. It could later provide an optional Linux Memcheck task for
uninitialized reads and leaks using an unsanitized debug test build. It would
complement the faster sanitizer tests. See
[Valgrind platforms](https://valgrind.org/info/platforms.html).
