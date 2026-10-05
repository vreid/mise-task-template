import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { at, list, text } from "./report-input.mts";

// Builds a repository whose main branch already has findings, then checks
// that task check:new tolerates them and fails on each newly added one.

const root = join(import.meta.dirname, "..");
const directory = await mkdtemp(join(tmpdir(), "check-new-"));

const existing = {
  "app/legacy.py":
    'import os\n\n\ndef legacy() -> None:\n    """Run input."""\n    os.system(os.environ["LEGACY"])\n',
  "examples/go/go.mod": "module example.com/demo\n\ngo 1.27.0\n",
  "examples/go/legacy.go":
    '// Package demo has pre-existing findings.\npackage demo\n\n// Legacy compares a value with itself.\nfunc Legacy(s string) bool { return s == "" || s == "" }\n',
};

function git(...args: readonly string[]): string {
  return execFileSync("git", args, { cwd: directory, encoding: "utf8" });
}

async function write(files: Readonly<Record<string, string>>): Promise<void> {
  await Promise.all(
    Object.keys(files).map(async (file) => {
      await mkdir(dirname(join(directory, file)), { recursive: true });
      await writeFile(join(directory, file), files[file] ?? "");
    }),
  );
}

async function commit(files: Readonly<Record<string, string>>): Promise<void> {
  await write(files);
  git("add", "--all");
  git("commit", "--quiet", "--message", "change");
}

function checkNew(): {
  readonly status: number | null;
  readonly output: string;
} {
  const run = spawnSync("bash", ["scripts/check-new.sh"], {
    cwd: directory,
    encoding: "utf8",
    env: { ...process.env, CHECK_BASE: "main" },
  });
  return { status: run.status, output: `${run.stdout}${run.stderr}` };
}

async function report(name: string): Promise<unknown> {
  const content = await readFile(join(directory, "reports/new", name), "utf8");
  return JSON.parse(content);
}

async function setUp(): Promise<void> {
  const copied = [
    "scripts/check-new.sh",
    "security/rules/python",
    "security/betterleaks.toml",
    ".golangci.yml",
  ];
  await Promise.all(
    copied.map((path) =>
      cp(join(root, path), join(directory, path), { recursive: true }),
    ),
  );
  git("init", "--quiet", "--initial-branch", "main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "Test");
  await commit({ ...existing, ".gitignore": "/reports/\n" });
  git("switch", "--quiet", "--create", "feature");
}

await setUp();

await test("the merge base has findings that a full scan reports", () => {
  const sast = spawnSync(
    "opengrep",
    ["scan", "--config", "security/rules", "--error", "--quiet", "."],
    { cwd: directory, encoding: "utf8" },
  );
  assert.equal(sast.status, 1, `${sast.stdout}${sast.stderr}`);
  const go = spawnSync(
    "golangci-lint",
    ["run", "--config", "../../.golangci.yml", "./..."],
    { cwd: join(directory, "examples/go"), encoding: "utf8" },
  );
  assert.match(go.stdout, /legacy\.go/u);
});

await test("tolerates findings that already exist at the merge base", async () => {
  await commit({ "app/notes.txt": "A change without findings.\n" });
  const { status, output } = checkNew();
  assert.equal(status, 0, output);
  assert.deepEqual(list(at(await report("sast.json"), "results")), []);
});

await test("rejects a new Opengrep finding and reports only that one", async () => {
  git("switch", "--quiet", "--force-create", "sast", "feature");
  await commit({
    "app/added.py":
      'import os\n\n\ndef added() -> None:\n    """Run input."""\n    os.system(os.environ["ADDED"])\n',
  });
  const { status, output } = checkNew();
  assert.equal(status, 1, output);
  const paths = list(at(await report("sast.json"), "results")).map((result) =>
    text(at(result, "path")),
  );
  assert.deepEqual(paths, ["app/added.py"]);
});

await test("rejects a new golangci-lint finding", async () => {
  git("switch", "--quiet", "--force-create", "go", "feature");
  await commit({
    "examples/go/added.go":
      "package demo\n\n// Added compares a value with itself.\nfunc Added(n int) bool { return n == 1 || n == 1 }\n",
  });
  const { status, output } = checkNew();
  assert.equal(status, 1, output);
  assert.match(
    output,
    /added\.go:4:\d+: .*\((?:staticcheck|gocritic|govet)\)/u,
  );
  assert.doesNotMatch(output, /legacy\.go/u);
});

await test("rejects a secret committed since the merge base", async () => {
  git("switch", "--quiet", "--force-create", "secret", "feature");
  // Generated at run time so this repository's own secret scan stays clean.
  const token = `ghp_${randomBytes(18).toString("hex")}`;
  await commit({ "app/settings.env": `GITHUB_TOKEN=${token}\n` });
  const { status, output } = checkNew();
  assert.equal(status, 1, output);
  const files = list(await report("secrets.json")).map((leak) =>
    text(at(leak, "File")),
  );
  assert.deepEqual(files, ["app/settings.env"]);
});

await test("refuses to compare with uncommitted tracked changes", async () => {
  git("switch", "--quiet", "--force-create", "dirty", "feature");
  await write({ "app/legacy.py": "# edited\n" });
  const { status, output } = checkNew();
  assert.equal(status, 2, output);
  git("checkout", "--", "app/legacy.py");
});

await rm(directory, { recursive: true, force: true });
