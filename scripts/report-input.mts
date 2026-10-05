import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { digest, reports } from "./report-run.mts";

export function at(
  value: unknown,
  ...path: readonly (string | number)[]
): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = Reflect.get(current, key);
  }
  return current;
}
export const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";
export const list = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

export async function manifestOf(): Promise<unknown> {
  const manifest: unknown = JSON.parse(
    await readFile(join(reports, "manifest.json"), "utf8"),
  );
  assert.ok(
    text(at(manifest, "run")) !== "",
    "Missing run identity; run task check or task verify",
  );
  assert.ok(text(at(manifest, "commit")) !== "", "Missing commit identity");
  assert.ok(list(at(manifest, "checks")).length > 0, "Missing check inventory");
  return manifest;
}

export async function artifact(
  manifest: unknown,
  name: string,
): Promise<string> {
  const expected = text(at(manifest, "artifacts", name));
  assert.ok(expected !== "", `Not produced by this run: ${name}`);
  const content = await readFile(join(reports, name), "utf8");
  assert.equal(
    digest(content),
    expected,
    `Report changed after its check: ${name}`,
  );
  return content;
}

export interface Inputs {
  readonly manifest: unknown;
  readonly data: ReadonlyMap<string, unknown>;
  readonly problems: readonly string[];
  readonly diagnostics: ReadonlyMap<string, string>;
}

function validate(name: string, value: unknown): void {
  const fields: Readonly<Record<string, readonly string[]>> = {
    "sast.json": ["results"],
    "sast-modules.json": ["results"],
    "vulnerabilities.json": ["matches"],
    "licenses.json": ["run", "targets"],
    "suppressions.json": ["suppressions"],
    "secrets.json": [],
    "secrets-history.json": [],
    "sloc.json": [],
  };
  const path = fields[name];
  if (path !== undefined)
    assert.ok(
      Array.isArray(at(value, ...path)),
      `Invalid report schema: ${name}`,
    );
  if (name.startsWith("sast"))
    assert.equal(
      list(at(value, "errors")).length,
      0,
      `Scanner errors: ${name}`,
    );
}

async function checkInputs(manifest: unknown, check: unknown): Promise<Inputs> {
  const data = new Map<string, unknown>();
  const diagnostics = new Map<string, string>();
  const problems: string[] = [];
  const task = text(at(check, "task"));
  const status = text(at(check, "status"));
  if (status !== "passed" && status !== "failed")
    problems.push(`${task}: ${status}`);
  await Promise.all(
    list(at(check, "outputs")).map(async (value) => {
      const name = text(value);
      try {
        const content = await artifact(manifest, name);
        const parsed: unknown = name.endsWith(".json")
          ? JSON.parse(content)
          : content;
        validate(name, parsed);
        data.set(name, parsed);
      } catch (error) {
        problems.push(`${task}: ${String(error)}`);
      }
    }),
  );
  if (status === "failed" || status === "passed") {
    try {
      diagnostics.set(task, await artifact(manifest, text(at(check, "log"))));
    } catch (error) {
      problems.push(`${task}: ${String(error)}`);
    }
  }
  return { manifest, data, problems, diagnostics };
}

/** Validate provenance and JSON before treating any report as evidence. */
export async function inputsOf(): Promise<Inputs> {
  const manifest = await manifestOf();
  const inputs = await Promise.all(
    list(at(manifest, "checks")).map((check) => checkInputs(manifest, check)),
  );
  const data = new Map<string, unknown>();
  const diagnostics = new Map<string, string>();
  const problems: string[] = [];
  for (const input of inputs) {
    for (const [name, value] of input.data) data.set(name, value);
    for (const [name, value] of input.diagnostics) diagnostics.set(name, value);
    problems.push(...input.problems);
  }
  return { manifest, data, problems, diagnostics };
}
