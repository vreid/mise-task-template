import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

await test("root and nested ignore edits do not masquerade as source changes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "sloc-policy-test-"));
  const git = (args: readonly string[]) =>
    execFileSync("git", args, { cwd: directory });
  try {
    await mkdir(join(directory, "scripts"));
    await mkdir(join(directory, "nested"));
    await copyFile(
      new URL("sloc-diff.mts", import.meta.url),
      join(directory, "scripts", "sloc-diff.mts"),
    );
    await writeFile(join(directory, "unchanged.py"), 'print("hello")\n');
    await writeFile(
      join(directory, "nested", "same.py"),
      'print("unchanged")\n',
    );
    await writeFile(join(directory, "nested", ".gitignore"), "same.py\n");
    await writeFile(join(directory, ".gitignore"), "reports/\n");
    git(["init", "-q"]);
    git(["add", "--force", "."]);
    git([
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "--no-verify",
      "-qm",
      "fixture",
    ]);
    await writeFile(join(directory, ".sccignore"), "unchanged.py\n");
    await rm(join(directory, "nested", ".gitignore"));
    execFileSync(process.execPath, ["scripts/sloc-diff.mts", "HEAD"], {
      cwd: directory,
    });
    const report = await readFile(
      join(directory, "reports", "sloc-diff.md"),
      "utf8",
    );
    assert.doesNotMatch(report, /\| Python \|/u);
    assert.match(report, /No language changed/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
