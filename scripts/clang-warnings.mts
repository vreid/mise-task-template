import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const policy: unknown = JSON.parse(
  await readFile(new URL("../.clang-warnings.json", import.meta.url), "utf8"),
);
assert.ok(isRecord(policy) && Array.isArray(policy["diagnostics"]));
const names: unknown[] = policy["diagnostics"];
assert.ok(
  names.length > 0 &&
    names.every((name): name is string => typeof name === "string"),
  "Expected a nonempty compiler diagnostic policy",
);
const required = new Set(names);
const [compiler, ...args] = process.argv.slice(2);
assert.ok(compiler !== undefined, "Expected compiler and compile arguments");

function compile(command: string, strict: boolean) {
  const result = spawnSync(
    command,
    [
      ...args,
      strict ? "-Werror" : "-Wno-error",
      "-ferror-limit=0",
      "-fdiagnostics-format=sarif",
      "-Wno-sarif-format-unstable",
    ],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (result.error !== undefined) throw result.error;
  assert.equal(result.signal, null, `Compiler terminated: ${result.signal}`);
  assert.ok(result.status !== null);
  return result;
}

// Keep the normal successful path at one -Werror compile. On failure, rerun
// without promotion to distinguish genuine errors from newly introduced warnings.
// SARIF's symbolic ruleId avoids unstable numeric diagnostic IDs / warning groups.
const strict = compile(compiler, true);
if (strict.status !== 0) {
  const advisory = compile(compiler, false);
  const start = advisory.stderr.indexOf("{");
  const end = advisory.stderr.lastIndexOf("}");
  assert.ok(start >= 0 && end >= start, advisory.stderr);
  const report: unknown = JSON.parse(advisory.stderr.slice(start, end + 1));
  assert.ok(isRecord(report) && report["version"] === "2.1.0");
  assert.ok(Array.isArray(report["runs"]));
  let failed = advisory.status !== 0;
  let warnings = 0;
  const runs: unknown[] = report["runs"];
  for (const run of runs) {
    assert.ok(isRecord(run) && Array.isArray(run["results"]));
    const diagnostics: unknown[] = run["results"];
    for (const diagnostic of diagnostics) {
      assert.ok(isRecord(diagnostic));
      const id = diagnostic["ruleId"];
      const level = diagnostic["level"];
      assert.ok(typeof id === "string" && /^[A-Za-z_]/u.test(id));
      if (level === "warning") {
        warnings += 1;
        const adopted = required.has(id);
        failed ||= adopted;
        console.error(
          `${adopted ? "Required" : "Advisory new"} warning: ${id}`,
        );
      }
    }
  }
  // Print native diagnostics (including source snippets and notes), not raw JSON.
  const display = spawnSync(
    compiler,
    [...args, "-Wno-error", "-ferror-limit=0"],
    {
      stdio: "inherit",
    },
  );
  if (display.error !== undefined) throw display.error;
  assert.equal(display.signal, null);
  failed ||= display.status !== 0;
  // A strict failure with no corresponding warnings is not safe to downgrade.
  process.exitCode = failed || warnings === 0 ? 1 : 0;
}
