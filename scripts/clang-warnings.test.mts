import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

async function verify(source: string, diagnostics: readonly string[]) {
  const directory = await mkdtemp(join(tmpdir(), "clang-policy-test-"));
  try {
    await mkdir(join(directory, "scripts"));
    await copyFile(
      new URL("clang-warnings.mts", import.meta.url),
      join(directory, "scripts", "clang-warnings.mts"),
    );
    await writeFile(
      join(directory, ".clang-warnings.json"),
      JSON.stringify({ diagnostics }),
    );
    await writeFile(join(directory, "fixture.c"), source);
    const result = spawnSync(
      process.execPath,
      [
        "scripts/clang-warnings.mts",
        "clang",
        "-std=c17",
        "-Weverything",
        "-c",
        "fixture.c",
        "-o",
        "fixture.o",
      ],
      { cwd: directory, encoding: "utf8" },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    return result;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

const unused = "int main(void) { int unused = 0; return 0; }\n";

await test("clean code passes the strict compiler invocation", async () => {
  const result = await verify("int main(void) { return 0; }\n", [
    "warn_unused_variable",
  ]);
  assert.equal(result.status, 0, result.stderr);
});

await test("an adopted warning fails", async () => {
  const result = await verify(unused, ["warn_unused_variable"]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /Required warning: warn_unused_variable/u);
});

await test("a new diagnostic within an existing group stays advisory", async () => {
  // Both are -Wunsafe-buffer-usage diagnostics: freezing the group is insufficient.
  const result = await verify(
    "int main(int argc, char **argv) { return argc > 1 ? argv[1][0] : 0; }\n",
    ["warn_unsafe_buffer_variable"],
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(
    result.stderr,
    /Advisory new warning: warn_unsafe_buffer_operation/u,
  );
});

await test("a new warning cannot hide a required warning", async () => {
  const result = await verify(
    "int main(void) { int unused = 0; return 0;; }\n",
    ["warn_unused_variable"],
  );
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /Required warning: warn_unused_variable/u);
  assert.match(result.stderr, /Advisory new warning: warn_null_statement/u);
});

await test("real compilation errors fail even with unadopted diagnostics", async () => {
  const result = await verify(
    "#warning advisory\nint main(void) { return missing; }\n",
    ["warn_unused_variable"],
  );
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /undeclared identifier/u);
  assert.match(result.stderr, /Advisory new warning:/u);
});

await test("an empty policy fails instead of making everything advisory", async () => {
  const result = await verify(unused, []);
  assert.notEqual(result.status, 0, result.stderr);
});
