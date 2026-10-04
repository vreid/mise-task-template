import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile } from "node:fs/promises";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

// Fixtures live in JSON so this file contains no live suppression markers.

type Files = Readonly<Record<string, string>>;

interface Expected {
  readonly file: string;
  readonly line: number;
  readonly tool: string;
  readonly rules: readonly string[];
  readonly valid: boolean;
}

interface Fixtures {
  readonly committed: Files;
  readonly uncommitted: Files;
  readonly expected: readonly Expected[];
}

interface Recorded extends Omit<Expected, "valid"> {
  readonly reason: string | null;
  readonly problems: readonly string[];
  readonly commit: string | null;
  readonly author: string | null;
}

interface Report {
  readonly revision: string | null;
  readonly suppressions: readonly Recorded[];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFixtures(value: unknown): value is Fixtures {
  return isRecord(value) && Array.isArray(value["expected"]);
}

function isReport(value: unknown): value is Report {
  return isRecord(value) && Array.isArray(value["suppressions"]);
}

const scripts = [
  "suppressions.mts",
  "suppression-catalog.mts",
  "suppression-directives.json",
];
const data: unknown = JSON.parse(
  await readFile(new URL("suppressions.test.json", import.meta.url), "utf8"),
);
assert.ok(isFixtures(data));
const fixtures = data;

function git(directory: string, args: readonly string[]): void {
  const identity = ["-c", "user.name=Fixture Author"];
  const email = ["-c", "user.email=fixture@example.invalid"];
  const unsigned = ["-c", "commit.gpgsign=false"];
  execFileSync("git", [...identity, ...email, ...unsigned, ...args], {
    cwd: directory,
    stdio: "ignore",
  });
}

async function write(directory: string, files: Files): Promise<void> {
  const writes = Object.keys(files).map(async (file) => {
    const path = join(directory, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, files[file] ?? "");
  });
  await Promise.all(writes);
}

/** Runs the register in a fresh repository with committed and new files. */
async function register() {
  const directory = await mkdtemp(join(tmpdir(), "suppressions-test-"));
  try {
    await mkdir(join(directory, "scripts"));
    const copies = scripts.map((name) =>
      copyFile(
        new URL(name, import.meta.url),
        join(directory, "scripts", name),
      ),
    );
    await Promise.all(copies);
    git(directory, ["init", "-q"]);
    await write(directory, fixtures.committed);
    git(directory, ["add", "-A"]);
    git(directory, ["commit", "-q", "--no-verify", "-m", "fixtures"]);
    await write(directory, fixtures.uncommitted);
    const result = spawnSync(process.execPath, ["scripts/suppressions.mts"], {
      cwd: directory,
      encoding: "utf8",
    });
    const path = join(directory, "reports", "suppressions.json");
    const report: unknown = JSON.parse(await readFile(path, "utf8"));
    assert.ok(isReport(report), result.stderr);
    return { status: result.status, stderr: result.stderr, report };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

const run = await register();

function recorded(expected: Expected): Recorded {
  const { file, line, tool } = expected;
  const match = run.report.suppressions.find(
    (entry) =>
      entry.file === file && entry.line === line && entry.tool === tool,
  );
  assert.ok(match !== undefined, `Missing ${tool} at ${file}:${line}`);
  return match;
}

await test("every directive is recorded with its tool and rules", () => {
  assert.equal(run.report.suppressions.length, fixtures.expected.length);
  for (const expected of fixtures.expected) {
    const entry = recorded(expected);
    const location = `${expected.file}:${expected.line}`;
    assert.deepEqual(entry.rules, expected.rules, location);
    assert.equal(entry.problems.length === 0, expected.valid, location);
  }
});

await test("invalid suppressions fail with their locations", () => {
  assert.equal(run.status, 1, run.stderr);
  for (const { file, line, tool, valid } of fixtures.expected) {
    const prefix = `${file}:${line}: ${tool}: `;
    const reported = run.stderr
      .split("\n")
      .some((row) => row.startsWith(prefix));
    assert.equal(reported, !valid, prefix);
  }
});

await test("reasons come from the directive or the comment above it", () => {
  for (const expected of fixtures.expected.filter(({ valid }) => valid)) {
    assert.notEqual(recorded(expected).reason, null, expected.file);
  }
  const above = { file: "native.c", line: 16, tool: "clang", rules: [] };
  assert.equal(
    recorded({ ...above, valid: true }).reason,
    "Arguments are validated by the caller.",
  );
  const native = { file: "lib.rs", line: 10, tool: "rust", rules: [] };
  assert.equal(recorded({ ...native, valid: false }).reason, null);
});

await test("committed suppressions carry Git attribution", () => {
  assert.match(run.report.revision ?? "", /^[\da-f]{40}$/u);
  for (const entry of run.report.suppressions) {
    const committed = entry.file in fixtures.committed;
    assert.equal(entry.commit !== null, committed, entry.file);
    assert.equal(entry.author, committed ? "Fixture Author" : null);
  }
});
