import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Compares scc code lines per language between a target branch and the
// working tree, with the same scc settings and ignore files on both sides, and
// writes the difference as Markdown to reports/sloc-diff.md.

const root = fileURLToPath(new URL("..", import.meta.url));
const [base = "origin/main"] = process.argv.slice(2);

function run(command: string, args: readonly string[], cwd: string): string {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Returns code lines per language for the tree at directory. */
function count(directory: string): Record<string, number> {
  const data: unknown = JSON.parse(
    run("scc", ["--no-config", "--format", "json", "."], directory),
  );
  assert.ok(Array.isArray(data), "Expected scc JSON");
  const lines: Record<string, number> = {};
  for (const entry of data) {
    assert.ok(typeof entry === "object" && entry !== null);
    const name: unknown = Reflect.get(entry, "Name");
    const code: unknown = Reflect.get(entry, "Code");
    assert.ok(typeof name === "string" && typeof code === "number");
    lines[name] = code;
  }
  return lines;
}

function signed(change: number): string {
  return change > 0 ? `+${change}` : String(change);
}

function policyFiles(directory: string): string[] {
  return run(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    directory,
  )
    .split("\0")
    .filter((file) =>
      [".gitignore", ".ignore", ".sccignore"].includes(basename(file)),
    );
}

/** Overlay the current counting policy, including nested ignores, on the baseline. */
async function applyPolicy(worktree: string): Promise<void> {
  await Promise.all(
    policyFiles(worktree).map((file) =>
      rm(join(worktree, file), { force: true }),
    ),
  );
  await Promise.all(
    policyFiles(root).map(async (file) => {
      const source = join(root, file);
      const info = await lstat(source).catch(() => null);
      if (info === null) return;
      assert.ok(
        info.isFile(),
        `Counting policy must be a regular file: ${file}`,
      );
      const destination = join(worktree, file);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }),
  );
}

/** Renders changed languages and the total as a Markdown table. */
function table(
  before: Readonly<Record<string, number>>,
  after: Readonly<Record<string, number>>,
) {
  const rows: string[] = [];
  const languages = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].toSorted();
  let [totalBefore, totalAfter] = [0, 0];
  for (const language of languages) {
    const [from, to] = [before[language] ?? 0, after[language] ?? 0];
    totalBefore += from;
    totalAfter += to;
    if (from !== to) {
      rows.push(`| ${language} | ${from} | ${to} | ${signed(to - from)} |`);
    }
  }
  const total = `| **Total** | ${totalBefore} | ${totalAfter} | ${signed(totalAfter - totalBefore)} |`;
  return rows.length === 0
    ? "No language changed its number of code lines."
    : [
        "| Language | Target | This change | Difference |",
        "| --- | ---: | ---: | ---: |",
        ...rows,
        total,
      ].join("\n");
}

async function main(): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "sloc-base-"));
  const worktree = join(directory, "base");
  // Add the worktree before the try, so a bad BASE fails with Git's own error
  // instead of a cleanup error about a worktree that was never created.
  try {
    run(
      "git",
      ["worktree", "add", "--quiet", "--detach", worktree, base],
      root,
    );
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  try {
    await applyPolicy(worktree);
    const before = count(worktree);
    const after = count(root);
    const commit = run("git", ["rev-parse", "--short", base], root).trim();
    const markdown = [
      "<!-- sloc-diff -->",
      `Code lines counted by scc, compared with \`${base}\` at \`${commit}\`:`,
      "Both snapshots use the current working tree's counting policy. Difference is net SLOC, not added/deleted lines.",
      "",
      table(before, after),
      "",
    ].join("\n");
    await mkdir(join(root, "reports"), { recursive: true });
    await writeFile(join(root, "reports", "sloc-diff.md"), markdown);
    console.log(markdown);
  } finally {
    run("git", ["worktree", "remove", "--force", worktree], root);
    await rm(directory, { recursive: true, force: true });
  }
}

await main();
