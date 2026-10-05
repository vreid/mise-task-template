# OWASP Top 10 and CWE Top 25 coverage

This matrix shows, for every OWASP Top 10:2025 category and every 2025 CWE Top
25 entry, which check in this template covers it and how strong the evidence is.
OS command injection (CWE-78, and CWE-77 through the same rules) is proven by
regression fixtures in every language. SQL, path, and code injection, unsafe
deserialization, SSRF, resource limits, weak hashing, and disabled TLS checks
are proven where the tested cells say so. Other weaknesses have an enabled rule
that no fixture exercises yet, and several cannot be found by static analysis at
all. Lists as of 2026-10-05.

## Evidence levels

| Level      | Meaning                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Tested     | A fixture in `security/tests` or `security/linter-tests` fails `task test` if the check stops catching it, or starts flagging the safe variant |
| Rule       | An enabled rule targets it, but no fixture here proves it; the tool's own tests are the only evidence                                          |
| Language   | The language or a forbidden construct prevents it: memory safety, no runtime code evaluation, no `unsafe`                                      |
| Runtime    | ASan and UBSan catch it during the C/C++ tests, but only on executed paths                                                                     |
| Not static | Static analysis cannot decide it; review, DAST, and penetration tests cover it, as the requirements foresee                                    |
| Gap        | Detectable in principle, but nothing here checks it                                                                                            |

The template's examples have no web, database, or file-upload code. Weaknesses
that only arise there show as gaps until a project adds such code, at which
point it needs rules and fixtures for its real frameworks.

## OWASP Top 10:2025

| Category                                   | Coverage   | Checks                                                                                                                                                                                      |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken Access Control                  | Not static | Authorization logic needs review, DAST, and penetration tests                                                                                                                               |
| A02 Security Misconfiguration              | Partial    | actionlint and read-only workflow permissions. Tested: disabled TLS verification, Ruff `S501` and gosec `G402`. Deployment configuration is not scanned                                     |
| A03 Software Supply Chain Failures         | Covered    | Syft SBOM, Grype gate on High/Critical CVEs, Grant license policy (advisory), frozen lockfiles, actions pinned by commit SHA                                                                |
| A04 Cryptographic Failures                 | Partial    | Tested: weak hashes, Ruff `S324` and gosec `G401`/`G501`. Rule: .NET `CA5350`/`CA5351`. Gap: TypeScript, Rust, C/C++                                                                        |
| A05 Injection                              | Partial    | Tested: OS command injection in all seven languages; SQL, path, and code injection where the CWE table says so. Gap: cross-site scripting, SQL injection in TypeScript, Rust, C#, and C/C++ |
| A06 Insecure Design                        | Not static | Design review and threat modeling                                                                                                                                                           |
| A07 Authentication Failures                | Partial    | Betterleaks finds hardcoded credentials in files, reports, and history; authentication logic is not static                                                                                  |
| A08 Software or Data Integrity Failures    | Partial    | Tested: unsafe deserialization, Python `S301` and C# `CA2300`/`CA2301`; locked dependencies and pinned actions                                                                              |
| A09 Security Logging and Alerting Failures | Not static | Operational review                                                                                                                                                                          |
| A10 Mishandling of Exceptional Conditions  | Partial    | Rule: Go `errcheck`, Rust `unwrap_used`/`expect_used`, Python `BLE001`/`S110`, C++ `bugprone-exception-escape`/`bugprone-empty-catch`. Gap: TypeScript, C# beyond the SDK set               |

## CWE Top 25 (2025)

| Rank | CWE                                    | TypeScript                          | Python             | Go                 | Rust       | C#                     | C/C++         |
| ---- | -------------------------------------- | ----------------------------------- | ------------------ | ------------------ | ---------- | ---------------------- | ------------- |
| 1    | CWE-79 Cross-site scripting            | Gap                                 | Gap                | Gap                | Gap        | Gap                    | Gap           |
| 2    | CWE-89 SQL injection                   | Gap                                 | Tested `S608`      | Tested `G202/G701` | Gap        | Gap                    | Gap           |
| 3    | CWE-352 CSRF                           | Not static                          | Not static         | Not static         | Not static | Not static             | Not static    |
| 4    | CWE-862 Missing authorization          | Not static                          | Not static         | Not static         | Not static | Not static             | Not static    |
| 5    | CWE-787 Out-of-bounds write            | Language                            | Language           | Language           | Language   | Language               | Rule, Runtime |
| 6    | CWE-22 Path traversal                  | Gap                                 | Gap                | Tested `G703`      | Gap        | Rule `CA3003`          | Gap           |
| 7    | CWE-416 Use after free                 | Language                            | Language           | Language           | Language   | Language               | Rule, Runtime |
| 8    | CWE-125 Out-of-bounds read             | Language                            | Language           | Language           | Language   | Language               | Rule, Runtime |
| 9    | CWE-78 OS command injection            | Tested                              | Tested             | Tested             | Tested     | Tested                 | Tested        |
| 10   | CWE-94 Code injection                  | Tested `no-eval`, `no-implied-eval` | Tested `S102/S307` | Language           | Language   | Gap                    | Language      |
| 11   | CWE-120 Classic buffer overflow        | Language                            | Language           | Language           | Language   | Language               | Rule, Runtime |
| 12   | CWE-434 Unrestricted upload            | Not static                          | Not static         | Not static         | Not static | Not static             | Not static    |
| 13   | CWE-476 NULL pointer dereference       | Rule (strict)                       | Gap                | Rule `SA5011`      | Language   | Rule (nullable)        | Rule, Runtime |
| 14   | CWE-121 Stack buffer overflow          | Language                            | Language           | Language           | Language   | Language               | Rule, Runtime |
| 15   | CWE-502 Unsafe deserialization         | Gap                                 | Tested `S301`      | Gap                | Gap        | Tested `CA2300/CA2301` | Gap           |
| 16   | CWE-122 Heap buffer overflow           | Language                            | Language           | Language           | Language   | Language               | Rule, Runtime |
| 17   | CWE-863 Incorrect authorization        | Not static                          | Not static         | Not static         | Not static | Not static             | Not static    |
| 18   | CWE-20 Improper input validation       | Partial                             | Partial            | Partial            | Partial    | Partial                | Partial       |
| 19   | CWE-284 Improper access control        | Not static                          | Not static         | Not static         | Not static | Not static             | Not static    |
| 20   | CWE-200 Sensitive information exposure | Partial                             | Partial            | Partial            | Partial    | Partial                | Partial       |
| 21   | CWE-306 Missing authentication         | Not static                          | Not static         | Not static         | Not static | Not static             | Not static    |
| 22   | CWE-918 SSRF                           | Gap                                 | Tested `S310`      | Tested `G704`      | Gap        | Gap                    | Gap           |
| 23   | CWE-77 Command injection               | Tested                              | Tested             | Tested             | Tested     | Tested                 | Tested        |
| 24   | CWE-639 Authorization bypass by key    | Not static                          | Not static         | Not static         | Not static | Not static             | Not static    |
| 25   | CWE-770 Unlimited resource allocation  | Gap                                 | Tested `S113`      | Tested `G110`      | Gap        | Gap                    | Gap           |

Notes on individual cells:

- **CWE-78 and CWE-77** are tested by the `input-to-shell` rules: environment
  and command-line input reaching a shell, including `sh`, `bash`, `cmd.exe`,
  and PowerShell. Ruff `S602`/`S605`, gosec `G204`, and clang-tidy
  `bugprone-command-processor` add a second layer. See
  [source security rules](sast.md).
- **C/C++ memory errors** (CWE-787, 125, 120, 121, 122, 416, 476) rely on
  clang-tidy (`clang-analyzer-security.ArrayBound`, `unix.Malloc`,
  `cplusplus.NewDelete`, `core.NullDereference`, `insecureAPI.strcpy`), the
  required `-Wunsafe-buffer-usage` diagnostics, and ASan/UBSan in tests. See
  [C and C++ checks](c-cpp.md).
- **Language** for C# assumes `unsafe` code stays disabled, as in the examples;
  for Rust, `unsafe_code` is forbidden.
- **CWE-476** in TypeScript and C# comes from the compilers' strict null and
  nullable analysis, both errors here. Go's `SA5011` is a Staticcheck check.
- **Verified, not assumed.** The tested cells come from
  `scripts/linter-fixtures.test.mts`, which lints `security/linter-tests` with
  this repository's configuration. Writing it corrected three earlier claims:
  gosec reports SQL injection as `G202`/`G701` rather than `G201`, path
  traversal as `G703` rather than `G304`, and SSRF as `G704` rather than `G107`.
  .NET's `CA2100` did not fire on a concatenated `CommandText`, so C# SQL
  injection is a gap.
- **C# taint rules** (`CA3001`, `CA3003`) treat web input as untrusted, not
  environment variables or arguments. The command-injection fixtures showed that
  gap for `CA3006`, which is why Opengrep covers C# command injection.
- **CWE-20** has no rule of its own; it is covered only where a more specific
  weakness above is. **CWE-200** is covered only for secrets, by Betterleaks.

## Next steps

Remaining `Rule` cells become `Tested` the same way: a fixture line marked
`expect: <rule>` beside a safe variant marked `ok: <rule>`. The clearest gaps
are SQL injection in TypeScript, Rust, C#, and C/C++, path traversal in Python
and TypeScript, and almost everything in Rust and TypeScript; these need
Opengrep rules with fixtures, as command injection got. `Not static` items
belong in review checklists, DAST, and penetration tests.

Sources: [OWASP Top 10:2025](https://top10.owasp.org/2025),
[2025 CWE Top 25](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html).
