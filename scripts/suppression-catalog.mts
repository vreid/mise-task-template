import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Loads and validates suppression-directives.json, the per-tool syntax that
// suppressions.mts enforces.

export interface Directive {
  readonly tool: string;
  readonly files: Readonly<RegExp>;
  readonly shebang: Readonly<RegExp> | null;
  readonly marker: Readonly<RegExp>;
  readonly form: Readonly<RegExp>;
  readonly blanket: Readonly<RegExp> | null;
  readonly nativeReason: boolean;
  readonly multiline: boolean;
  readonly expected: string;
}

export interface Catalog {
  readonly comment: Readonly<RegExp>;
  readonly directives: readonly Directive[];
}

type Entry = Readonly<Record<string, unknown>>;

function isEntry(value: unknown): value is Entry {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pattern(entry: Entry, key: string): Readonly<RegExp> | null {
  const value = entry[key];
  const flags = entry["flags"] ?? "u";
  if (value === undefined) {
    return null;
  }
  assert.ok(typeof value === "string" && typeof flags === "string", key);
  return new RegExp(value, flags);
}

function directiveOf(entry: unknown): Directive {
  assert.ok(isEntry(entry), "Expected a suppression directive object");
  const { tool, expected } = entry;
  const files = pattern(entry, "files");
  const marker = pattern(entry, "marker");
  const form = pattern(entry, "form");
  assert.ok(typeof tool === "string" && typeof expected === "string");
  assert.ok(files !== null && marker !== null && form !== null, tool);
  return {
    tool,
    files,
    shebang: pattern(entry, "shebang"),
    marker,
    form,
    blanket: pattern(entry, "blanket"),
    nativeReason: entry["nativeReason"] === true,
    multiline: entry["multiline"] === true,
    expected,
  };
}

export async function loadCatalog(): Promise<Catalog> {
  const path = new URL("suppression-directives.json", import.meta.url);
  const data: unknown = JSON.parse(await readFile(path, "utf8"));
  assert.ok(isEntry(data) && typeof data["comment"] === "string");
  assert.ok(Array.isArray(data["directives"]), "Expected directives");
  const entries: unknown[] = data["directives"];
  return {
    comment: new RegExp(data["comment"], "u"),
    directives: entries.map((entry) => directiveOf(entry)),
  };
}
