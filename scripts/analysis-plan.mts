export interface Check {
  readonly task: string;
  readonly outputs: readonly string[];
  readonly requires: readonly string[];
}

function check(
  task: string,
  outputs: readonly string[] = [],
  requires: readonly string[] = [],
): Check {
  return { task, outputs, requires };
}

/** Independent checks continue after failures; only real prerequisites block work. */
export function plan(mode: string): Check[] {
  const verify = mode === "verify";
  const native = verify ? "verify" : "check";
  const setup = verify ? [check("deps"), check("build", [], ["deps"])] : [];
  const dependencies = verify ? ["deps"] : [];
  return [
    ...setup,
    ...["typescript", "go", "rust", "csharp", "python"].map((language) =>
      check(`check:${language}`, [], dependencies),
    ),
    check(`${native}:c`),
    check(`${native}:cpp`),
    check("check:scc", ["sloc.json"]),
    check("check:lizard", ["complexity.csv"]),
    check("check:shell"),
    check("check:docs", [], dependencies),
    check("check:actions"),
    check("check:sast", ["sast.json", "sast-modules.json"]),
    check("check:suppressions", ["suppressions.json"]),
    check(
      "check:sbom",
      ["sbom.syft.json", "sbom.cdx.json", "sbom.spdx.json"],
      dependencies,
    ),
    check(
      "check:licenses:scan",
      process.platform === "win32" ? [] : ["licenses.json"],
      ["check:sbom"],
    ),
    check(
      "check:vulnerabilities:scan",
      ["vulnerabilities.json"],
      ["check:sbom"],
    ),
    check(`${native}:fmt`, [], dependencies),
    ...(verify ? [check("test", [], ["deps", "build", "check:sast"])] : []),
    check("check:secrets", ["secrets.json"]),
    ...(verify
      ? [check("check:secrets:history", ["secrets-history.json"])]
      : []),
  ];
}
