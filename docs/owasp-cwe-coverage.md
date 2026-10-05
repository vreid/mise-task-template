# OWASP Top 10 and CWE Top 25 coverage

This matrix shows, for every OWASP Top 10:2025 category and every 2025 CWE Top
25 entry, which check in this template covers it and how strong the evidence is.
The 41 Opengrep rules and language-linter fixtures prove concrete unsafe and
safe API patterns. OS command injection, SQL injection, path traversal, and SSRF
are tested in all seven languages. Raw HTML is tested in five; C/C++
web-framework coverage is still application-specific. Weak hashing is tested in
every language. Some memory diagnostics still rely on enabled compiler/analyzer
rules and runtime instrumentation. Authorization, authentication, CSRF, upload
handling, and other business-logic decisions require an application's trust
boundaries. Lists as of 2026-10-05.

## Evidence levels

| Level    | Meaning                                                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Tested   | A fixture in `security/tests` or `security/linter-tests` fails `task test` if the check stops catching it, or starts flagging the safe variant |
| Rule     | An enabled rule targets it, but no fixture here proves it; the tool's own tests are the only evidence                                          |
| Language | The language or a forbidden construct prevents it: memory safety, no runtime code evaluation, no `unsafe`                                      |
| Runtime  | ASan and UBSan catch it during the C/C++ tests, but only on executed paths                                                                     |
| Context  | No application-specific static rule is configured here; review, threat modeling, DAST, and penetration tests supply the missing evidence       |
| Gap      | Detectable in principle, but nothing here checks it                                                                                            |

The template's examples have no web, database, or file-upload code. The tested
web and database APIs are demonstration fixtures, not production features. A
project adding other frameworks must extend the rules and fixtures.
Context-dependent controls are not counted as statically proven coverage.

## OWASP Top 10:2025

| Category                                   | Coverage | Checks                                                                                                                                                                        |
| ------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken Access Control                  | Partial  | Tested path traversal and SSRF in all seven languages. Application authorization still requires contextual review.                                                            |
| A02 Security Misconfiguration              | Partial  | Tested disabled TLS verification in TypeScript, Python, Go, Rust, C/C++; actionlint checks CI configuration. Deployment configuration needs application-specific checks.      |
| A03 Software Supply Chain Failures         | Covered  | Syft SBOM, Grype gate on High/Critical CVEs, Grant license policy (advisory), frozen lockfiles, actions pinned by commit SHA                                                  |
| A04 Cryptographic Failures                 | Partial  | Tested weak hashes: Opengrep in TypeScript/Rust/C/C++, Ruff `S324`, gosec `G401`/`G501`, .NET `CA5351`. Protocol choice and key management need review.                       |
| A05 Injection                              | Partial  | Tested command and SQL injection in all seven languages; unescaped HTML in TypeScript/Python/Go/C#/Rust. C/C++ HTML and other framework APIs need project-specific rules.     |
| A06 Insecure Design                        | Context  | Design review and threat modeling                                                                                                                                             |
| A07 Authentication Failures                | Partial  | Betterleaks finds hardcoded credentials in files, reports, and history; authentication logic is not static                                                                    |
| A08 Software or Data Integrity Failures    | Partial  | Tested: unsafe deserialization, Python `S301` and C# `CA2300`/`CA2301`; locked dependencies and pinned actions                                                                |
| A09 Security Logging and Alerting Failures | Context  | Operational review                                                                                                                                                            |
| A10 Mishandling of Exceptional Conditions  | Partial  | Rule: Go `errcheck`, Rust `unwrap_used`/`expect_used`, Python `BLE001`/`S110`, C++ `bugprone-exception-escape`/`bugprone-empty-catch`. Gap: TypeScript, C# beyond the SDK set |

## CWE Top 25 (2025)

| Rank | CWE                                    | TypeScript                          | Python             | Go            | Rust     | C#                     | C/C++         |
| ---- | -------------------------------------- | ----------------------------------- | ------------------ | ------------- | -------- | ---------------------- | ------------- |
| 1    | CWE-79 Cross-site scripting            | Tested                              | Tested             | Tested        | Tested   | Tested                 | Gap           |
| 2    | CWE-89 SQL injection                   | Tested                              | Tested             | Tested        | Tested   | Tested                 | Tested        |
| 3    | CWE-352 CSRF                           | Context                             | Context            | Context       | Context  | Context                | Context       |
| 4    | CWE-862 Missing authorization          | Context                             | Context            | Context       | Context  | Context                | Context       |
| 5    | CWE-787 Out-of-bounds write            | Language                            | Language           | Language      | Language | Language               | Rule, Runtime |
| 6    | CWE-22 Path traversal                  | Tested                              | Tested             | Tested        | Tested   | Tested                 | Tested        |
| 7    | CWE-416 Use after free                 | Language                            | Language           | Language      | Language | Language               | Rule, Runtime |
| 8    | CWE-125 Out-of-bounds read             | Language                            | Language           | Language      | Language | Language               | Rule, Runtime |
| 9    | CWE-78 OS command injection            | Tested                              | Tested             | Tested        | Tested   | Tested                 | Tested        |
| 10   | CWE-94 Code injection                  | Tested `no-eval`, `no-implied-eval` | Tested `S102/S307` | Language      | Language | Gap                    | Language      |
| 11   | CWE-120 Classic buffer overflow        | Language                            | Language           | Language      | Language | Language               | Rule, Runtime |
| 12   | CWE-434 Unrestricted upload            | Context                             | Context            | Context       | Context  | Context                | Context       |
| 13   | CWE-476 NULL pointer dereference       | Rule (strict)                       | Gap                | Rule `SA5011` | Language | Rule (nullable)        | Rule, Runtime |
| 14   | CWE-121 Stack buffer overflow          | Language                            | Language           | Language      | Language | Language               | Rule, Runtime |
| 15   | CWE-502 Unsafe deserialization         | Gap                                 | Tested `S301`      | Gap           | Gap      | Tested `CA2300/CA2301` | Gap           |
| 16   | CWE-122 Heap buffer overflow           | Language                            | Language           | Language      | Language | Language               | Rule, Runtime |
| 17   | CWE-863 Incorrect authorization        | Context                             | Context            | Context       | Context  | Context                | Context       |
| 18   | CWE-20 Improper input validation       | Partial                             | Partial            | Partial       | Partial  | Partial                | Partial       |
| 19   | CWE-284 Improper access control        | Context                             | Context            | Context       | Context  | Context                | Context       |
| 20   | CWE-200 Sensitive information exposure | Partial                             | Partial            | Partial       | Partial  | Partial                | Partial       |
| 21   | CWE-306 Missing authentication         | Context                             | Context            | Context       | Context  | Context                | Context       |
| 22   | CWE-918 SSRF                           | Tested                              | Tested             | Tested        | Tested   | Tested                 | Tested        |
| 23   | CWE-77 Command injection               | Tested                              | Tested             | Tested        | Tested   | Tested                 | Tested        |
| 24   | CWE-639 Authorization bypass by key    | Context                             | Context            | Context       | Context  | Context                | Context       |
| 25   | CWE-770 Unlimited resource allocation  | Gap                                 | Tested `S113`      | Tested `G110` | Gap      | Gap                    | Gap           |

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
  .NET's `CA2100` did not fire on a concatenated `CommandText`; the new Opengrep
  C# taint rule now covers that flow with positive and negative fixtures.
- **C# taint rules** (`CA3001`, `CA3003`) treat web input as untrusted, not
  environment variables or arguments. The command-injection fixtures showed that
  gap for `CA3006`, which is why Opengrep covers C# command injection.
- **CWE-20** has no rule of its own; it is covered only where a more specific
  weakness above is. **CWE-200** is covered only for secrets, by Betterleaks.

## Applicability and remaining limits

`data-injection.yml` and `unsafe-security.yml` add tested rules for the
previously uncovered database, filesystem, HTTP, raw-HTML, hash, and TLS APIs.
See [source security rules](sast.md) for the exact API families. A `Tested` cell
means those fixtures are detected and their safe alternatives are not; it does
not mean every possible implementation of that CWE is detected.

The word-count applications have no authentication, authorization, browser
sessions, file uploads, deployment configuration, or security audit-log design.
Those controls are outside their functionality. Before applying the template to
an application that has them, identify its frameworks and trust boundaries, add
rules for dangerous configuration and data flows, and validate the required
behavior with integration/security tests and review. Generic local pattern
matching cannot establish those application-specific properties.

C/C++ raw HTML rendering, additional code-evaluation/deserialization libraries,
and resource-control APIs still need framework-specific rules when used. A
complete application assessment also exercises the enabled memory analyzers and
runtime sanitizers on meaningful application paths. Existing `Rule`, `Runtime`,
and `Context` labels are deliberately retained where no regression fixture
proves more.

Sources: [OWASP Top 10:2025](https://top10.owasp.org/2025),
[2025 CWE Top 25](https://cwe.mitre.org/top25/archive/2025/2025_cwe_top25.html).
