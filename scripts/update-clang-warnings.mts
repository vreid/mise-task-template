import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";

// Snapshot every known warning, not just diagnostics emitted by today's code.
// This is deliberately separate from the normal tool-update task.
const output = execFileSync("diagtool", ["list-warnings"], {
  encoding: "utf8",
});
const diagnostics = [...output.matchAll(/^  (\w+)(?: \[-W[^\]]+\])?$/gmu)]
  .map((match: readonly string[]) => match[1])
  .filter((name): name is string => name !== undefined)
  .toSorted();
assert.ok(diagnostics.length > 0, "diagtool returned no diagnostic names");
assert.equal(new Set(diagnostics).size, diagnostics.length);
const compiler = execFileSync("clang", ["--version"], {
  encoding: "utf8",
}).split("\n")[0];
assert.ok(compiler !== undefined);
await writeFile(
  new URL("../.clang-warnings.json", import.meta.url),
  `${JSON.stringify({ compiler, diagnostics }, null, 2)}\n`,
);
console.log(`Adopted ${diagnostics.length} warning IDs from ${compiler}.`);
