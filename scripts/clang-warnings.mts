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

function warningName(diagnostic: unknown): string | undefined {
  assert.ok(isRecord(diagnostic));
  const id = diagnostic["ruleId"];
  assert.ok(typeof id === "string" && /^[A-Za-z_]/u.test(id));
  return diagnostic["level"] === "warning" ? id : undefined;
}

function reportWarning(id: string): boolean {
  const adopted = required.has(id);
  console.error(`${adopted ? "Required" : "Advisory new"} warning: ${id}`);
  return adopted;
}

function classifyWarnings(stderr: string) {
  const start = stderr.indexOf("{");
  const end = stderr.lastIndexOf("}");
  assert.ok(start >= 0 && end >= start, stderr);
  const report: unknown = JSON.parse(stderr.slice(start, end + 1));
  assert.ok(isRecord(report) && report["version"] === "2.1.0");
  assert.ok(Array.isArray(report["runs"]));
  let failed = false;
  let warnings = 0;
  const runs: unknown[] = report["runs"];
  const diagnostics = runs.flatMap((run: unknown): unknown[] => {
    assert.ok(isRecord(run) && Array.isArray(run["results"]));
    return run["results"];
  });
  for (const diagnostic of diagnostics) {
    const id = warningName(diagnostic);
    if (id !== undefined) {
      warnings += 1;
      const adopted = reportWarning(id);
      failed ||= adopted;
    }
  }
  return { failed, warnings };
}

// Keep the normal successful path at one -Werror compile. On failure, rerun
// without promotion to distinguish genuine errors from newly introduced warnings.
// SARIF's symbolic ruleId avoids unstable numeric diagnostic IDs / warning groups.
const strict = compile(compiler, true);
if (strict.status !== 0) {
  const advisory = compile(compiler, false);
  const classification = classifyWarnings(advisory.stderr);
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
  const failed =
    classification.failed || advisory.status !== 0 || display.status !== 0;
  // A strict failure with no corresponding warnings is not safe to downgrade.
  process.exitCode = failed || classification.warnings === 0 ? 1 : 0;
}
