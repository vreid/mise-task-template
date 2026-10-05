import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { plan, type Check } from "./analysis-plan.mts";

export const root = fileURLToPath(new URL("..", import.meta.url));
export const reports = join(root, "reports");
export type State = "pending" | "running" | "passed" | "failed" | "skipped";
export interface Result extends Check {
  readonly status: State;
  readonly exitCode: number | null;
  readonly log: string;
}
export interface Manifest {
  readonly run: string;
  readonly commit: string;
  readonly dirty: boolean;
  readonly generated: string;
  readonly platform: string;
  readonly mode: string;
  readonly status: "running" | "passed" | "failed";
  readonly checks: readonly Result[];
  readonly artifacts: Readonly<Record<string, string>>;
}

export const digest = (data: string): string =>
  createHash("sha256").update(data).digest("hex");

function git(args: readonly string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

export async function save(manifest: Manifest): Promise<void> {
  await writeFile(
    join(reports, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

/** Caller holds the analysis lock. No previous run's files survive initialization. */
export async function initialize(mode: string): Promise<Manifest> {
  assert.ok(mode === "check" || mode === "verify", "Expected check or verify");
  const manifest: Manifest = {
    run: randomUUID(),
    commit: git(["rev-parse", "HEAD"]),
    dirty: git(["status", "--porcelain"]) !== "",
    generated: new Date().toISOString(),
    platform: `${process.platform}-${process.arch}`,
    mode,
    status: "running",
    checks: plan(mode).map((entry) => ({
      task: entry.task,
      outputs: entry.outputs,
      requires: entry.requires,
      status: "pending",
      exitCode: null,
      log: `logs/${entry.task.replaceAll(":", "-")}.log`,
    })),
    artifacts: {},
  };
  await rm(reports, { recursive: true, force: true });
  await mkdir(join(reports, "logs"), { recursive: true });
  await save(manifest);
  return manifest;
}

export function updated(manifest: Manifest, result: Result): Manifest {
  return {
    ...manifest,
    checks: manifest.checks.map((entry) =>
      entry.task === result.task ? result : entry,
    ),
  };
}

export async function record(
  manifest: Manifest,
  result: Result,
): Promise<Manifest> {
  const values = await Promise.all(
    [result.log, ...result.outputs].map(async (name) => {
      try {
        return [
          name,
          digest(await readFile(join(reports, name), "utf8")),
        ] as const;
      } catch {
        return [name, ""] as const;
      }
    }),
  );
  const missing = values.some(([, hash]) => hash === "");
  const next = updated(
    manifest,
    missing ? { ...result, status: "failed" } : result,
  );
  const recorded = {
    ...next,
    artifacts: { ...manifest.artifacts, ...Object.fromEntries(values) },
  };
  await save(recorded);
  return recorded;
}
