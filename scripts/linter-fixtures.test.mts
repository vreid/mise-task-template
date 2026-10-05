import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import oxlintConfig from "../oxlint.config.mts";

// Proves that the security rules the coverage matrix relies on fire, with this
// repository's own configuration. In security/linter-tests, a comment
// `expect: RULE` requires RULE on the next line; `ok: RULE` forbids it there.

const root = fileURLToPath(new URL("..", import.meta.url));
const fixtures = join(root, "security", "linter-tests");

/** Runs a tool, accepting its findings exit codes, and returns its output. */
function run(command: string, args: readonly string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error !== undefined) {
    throw result.error;
  }
  return `${result.stdout}\n${result.stderr}`;
}

/** Collects `line:rule` pairs from tool output with one regex. */
function findings(output: string, pattern: Readonly<RegExp>): string[] {
  const found = new Set<string>();
  for (const match of output.matchAll(new RegExp(pattern, "gmu"))) {
    found.add(`${match[1] ?? ""}:${match[2] ?? ""}`);
  }
  return [...found];
}

async function verify(file: string, found: readonly string[]) {
  const lines = (await readFile(join(fixtures, file), "utf8")).split(/\r?\n/u);
  let expectations = 0;
  for (const [index, line] of lines.entries()) {
    const [, kind, rules = ""] = /\b(expect|ok): ([\w, -]+)$/u.exec(line) ?? [];
    for (const rule of kind === undefined ? [] : rules.split(",")) {
      const finding = `${index + 2}:${rule.trim()}`;
      assert.equal(
        found.includes(finding),
        kind === "expect",
        `${file} ${finding}`,
      );
      expectations += 1;
    }
  }
  assert.ok(expectations > 0, `${file} has no expectations`);
}

await test("Ruff security rules fire on the Python fixture", async () => {
  const file = "python/weaknesses.py";
  const args = ["check", "--config", ".ruff.toml", "--no-cache"];
  const output = run(
    "ruff",
    [...args, "--output-format", "concise", join(fixtures, file)],
    root,
  );
  await verify(file, findings(output, /:(\d+):\d+: ([A-Z]+\d+) /u));
});

await test("gosec rules fire on the Go fixture", async () => {
  const config = join(root, ".golangci.yml");
  const args = ["run", "--config", config, "--max-same-issues", "0", "./..."];
  const output = run("golangci-lint", args, join(fixtures, "go"));
  await verify("go/weaknesses.go", findings(output, /:(\d+):\d+: (G\d+):/u));
});

await test("oxlint rules fire on the TypeScript fixture", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oxlint-fixtures-"));
  try {
    // The repository's own rules, minus the pattern that skips the fixtures.
    const { ignorePatterns, ...rules } = oxlintConfig;
    assert.ok(ignorePatterns !== undefined);
    const config = join(directory, "oxlint.json");
    await writeFile(config, JSON.stringify(rules));
    const file = "typescript/weaknesses.ts";
    const cli = join(root, "node_modules", "oxlint", "bin", "oxlint");
    const args = [cli, "-c", config, "-f", "unix", join(fixtures, file)];
    const output = run(process.execPath, args, root);
    await verify(file, findings(output, /:(\d+):\d+: .*\(([\w-]+)\)\]$/u));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

await test(".NET analyzers fire on the C# fixture", async () => {
  const project = join(fixtures, "csharp", "Fixtures.csproj");
  const output = run("dotnet", ["build", project, "--no-incremental"], root);
  await verify(
    "csharp/Deserialization.cs",
    findings(output, /Deserialization\.cs\((\d+),\d+\): \w+ ([A-Z]+\d+):/u),
  );
});

await test("gosec rejects reasonless native exceptions and accepts justified ones", async () => {
  const directory = await mkdtemp(join(tmpdir(), "gosec-exceptions-"));
  const config = join(root, ".golangci.yml");
  const code =
    '// Package fixture exercises native gosec exceptions.\npackage fixture\nimport "crypto/md5" // #nosec G501 REASON\n// Digest calculates a legacy checksum.\nfunc Digest(input []byte) [16]byte { return md5.Sum(input) /* #nosec G401 REASON */ }\n';
  try {
    await writeFile(
      join(directory, "go.mod"),
      "module fixture.invalid\n\ngo 1.26\n",
    );
    await writeFile(
      join(directory, "fixture.go"),
      code.replaceAll("REASON", ""),
    );
    const unsafe = run(
      "golangci-lint",
      ["run", "--config", config, "./..."],
      directory,
    );
    assert.match(unsafe, /G401|G501/u);
    await writeFile(
      join(directory, "fixture.go"),
      code.replaceAll("REASON", "-- legacy public checksum compatibility"),
    );
    const safe = run(
      "golangci-lint",
      ["run", "--config", config, "./..."],
      directory,
    );
    assert.doesNotMatch(safe, /G401|G501/u);
    assert.match(safe, /0 issues/u);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
