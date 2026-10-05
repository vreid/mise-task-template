import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  initialize,
  record,
  reports,
  root,
  save,
  updated,
  type Manifest,
  type Result,
} from "./report-run.mts";

const lock = join(root, ".analysis-lock");

function invoke(args: readonly string[]) {
  return spawnSync("task", ["--silent", ...args], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

async function execute(manifest: Manifest, result: Result): Promise<Manifest> {
  const blocked = result.requires.some(
    (task) =>
      manifest.checks.find((entry) => entry.task === task)?.status !== "passed",
  );
  if (blocked) {
    const next = updated(manifest, { ...result, status: "skipped" });
    await save(next);
    return next;
  }
  await save(updated(manifest, { ...result, status: "running" }));
  console.log(`Analysis: ${result.task}`);
  const run = invoke([result.task]);
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}${run.error?.message ?? ""}`;
  process.stdout.write(output);
  await writeFile(join(reports, result.log), output);
  const exitCode = run.status ?? 1;
  return record(manifest, {
    ...result,
    exitCode,
    status: exitCode === 0 ? "passed" : "failed",
  });
}

async function main(): Promise<void> {
  const [mode] = process.argv.slice(2);
  assert.ok(mode === "check" || mode === "verify", "Expected check or verify");
  // Do not let concurrent runs mix their evidence or delete each other's reports.
  await mkdir(lock);
  try {
    let manifest = await initialize(mode);
    for (const result of manifest.checks) {
      // oxlint-disable-next-line no-await-in-loop -- Checks share build outputs and reports; preserve their prerequisite order.
      manifest = await execute(manifest, result);
    }
    const status = manifest.checks.every((entry) => entry.status === "passed")
      ? "passed"
      : "failed";
    await save({ ...manifest, status });
    const collected = invoke(["check:findings"]);
    process.stdout.write(`${collected.stdout}${collected.stderr}`);
    process.exitCode = status === "passed" && collected.status === 0 ? 0 : 1;
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}

await main();
