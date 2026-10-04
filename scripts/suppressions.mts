import { execFileSync } from "node:child_process";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type Catalog,
  type Directive,
  loadCatalog,
} from "./suppression-catalog.mts";

// Every inline suppression must name specific rules and state a reason. This
// register enforces both and records each one, with its commit, in
// reports/suppressions.json. suppression-directives.json defines the syntax.

interface Source extends Catalog {
  readonly file: string;
  readonly lines: readonly string[];
}

interface Suppression {
  readonly tool: string;
  readonly file: string;
  readonly line: number;
  readonly rules: readonly string[];
  readonly reason: string | null;
  readonly problems: readonly string[];
  /** The commit that last changed the line; null while uncommitted. */
  readonly commit: string | null;
}

type Groups = Readonly<Partial<Record<string, string>>>;

const root = fileURLToPath(new URL("..", import.meta.url));
const blames = new Map<string, ReadonlyMap<number, string | null>>();

function git(args: readonly string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

function listed(args: readonly string[]): string[] {
  const files = git(["ls-files", "-z", ...args]).split("\0");
  return [...new Set(files)].filter((file) => file !== "");
}

const tracked = new Set(listed(["--cached"]));

function clean(text: string | undefined): string | undefined {
  const value = text?.replace(/\s*(?:\*\/|-->)\s*$/u, "").trim();
  return value === undefined || value === "" ? undefined : value;
}

/** Joins the comment lines directly above a directive. */
function commentAbove(source: Source, index: number): string | undefined {
  const texts: string[] = [];
  for (let current = index - 1; current >= 0; current -= 1) {
    const line = source.lines[current] ?? "";
    const text = source.comment.exec(line)?.groups?.["text"];
    const directive = source.directives.some(({ marker }) => marker.test(line));
    if (text === undefined || directive) {
      break;
    }
    texts.unshift(text);
  }
  return clean(texts.join(" "));
}

/** Returns a directive's line, joined with an attribute's later lines. */
function statementAt(source: Source, index: number, multiline: boolean) {
  const parts: string[] = [];
  const end = multiline ? index + 10 : index + 1;
  for (const line of source.lines.slice(index, end)) {
    parts.push(line.trim());
    if (line.includes(")]")) {
      break;
    }
  }
  return parts.join(" ");
}

function problemsOf(
  directive: Directive,
  rules: readonly string[],
  reason: string | undefined,
): string[] {
  const problems: string[] = [];
  if (rules.length === 0) {
    problems.push(`name the specific rule: ${directive.expected}`);
  }
  const blanket = rules.filter(
    (rule) => directive.blanket?.test(rule) === true,
  );
  if (blanket.length > 0) {
    problems.push(`replace blanket ${blanket.join(", ")} with specific rules`);
  }
  if (reason === undefined || !/\p{L}/u.test(reason)) {
    problems.push(`state a reason: ${directive.expected}`);
  }
  return problems;
}

/**
 * Maps each line of a tracked file to the commit that last changed it. Names
 * and dates stay in Git, where the commit (and its pull request) leads.
 */
function blame(file: string): ReadonlyMap<number, string | null> {
  const lines = new Map<number, string | null>();
  for (const row of git(["blame", "--porcelain", "--", file]).split("\n")) {
    const [commit = "", , line = ""] = row.split(" ");
    if (/^[\da-f]{40}$/u.test(commit)) {
      lines.set(Number(line), /^0+$/u.test(commit) ? null : commit);
    }
  }
  return lines;
}

function commitAt(file: string, line: number): string | null {
  if (!tracked.has(file)) {
    return null;
  }
  const lines = blames.get(file) ?? blame(file);
  blames.set(file, lines);
  return lines.get(line) ?? null;
}

function rulesOf(groups: Groups): string[] {
  const rules = groups["scope"] ?? groups["rules"] ?? "";
  return rules.split(/[\s,]+/u).filter((rule) => rule !== "");
}

/** Uses the directive's own reason, or a comment above unless native. */
function reasonOf(source: Source, directive: Directive, index: number) {
  const statement = statementAt(source, index, directive.multiline);
  const groups: Groups = directive.form.exec(statement)?.groups ?? {};
  const reason = clean(groups["reason"]);
  if (reason !== undefined || directive.nativeReason) {
    return { rules: rulesOf(groups), reason };
  }
  return { rules: rulesOf(groups), reason: commentAbove(source, index) };
}

function evaluate(source: Source, directive: Directive, index: number) {
  const { rules, reason } = reasonOf(source, directive, index);
  const suppression: Suppression = {
    tool: directive.tool,
    file: source.file,
    line: index + 1,
    rules,
    reason: reason ?? null,
    problems: problemsOf(directive, rules, reason),
    commit: commitAt(source.file, index + 1),
  };
  return suppression;
}

function scan(catalog: Catalog, file: string, text: string): Suppression[] {
  const lines = text.split(/\r?\n/u);
  const first = lines[0] ?? "";
  const directives = catalog.directives.filter(
    ({ files, shebang }) => files.test(file) || shebang?.test(first) === true,
  );
  const source: Source = { file, lines, comment: catalog.comment, directives };
  const found: Suppression[] = [];
  for (const [index, line] of lines.entries()) {
    for (const directive of directives) {
      if (directive.marker.test(line)) {
        found.push(evaluate(source, directive, index));
      }
    }
  }
  return found;
}

async function readText(file: string): Promise<string | null> {
  const path = join(root, file);
  if (!(await lstat(path)).isFile()) {
    return null;
  }
  const content = await readFile(path);
  return content.includes(0) ? null : content.toString("utf8");
}

function revision(): string | null {
  try {
    return git(["rev-parse", "--verify", "--quiet", "HEAD"]).trim();
  } catch {
    return null;
  }
}

async function writeRegister(suppressions: readonly Suppression[]) {
  await mkdir(join(root, "reports"), { recursive: true });
  const register = { revision: revision(), suppressions };
  await writeFile(
    join(root, "reports", "suppressions.json"),
    `${JSON.stringify(register, null, 2)}\n`,
  );
}

/** Prints problems and a per-tool summary; returns the invalid count. */
function summarize(suppressions: readonly Suppression[]): number {
  const counts = new Map<string, number>();
  let invalid = 0;
  for (const { tool, file, line, problems } of suppressions) {
    counts.set(tool, (counts.get(tool) ?? 0) + 1);
    invalid += problems.length > 0 ? 1 : 0;
    for (const problem of problems) {
      console.error(`${file}:${line}: ${tool}: ${problem}`);
    }
  }
  const tools = [...counts.keys()].map((tool) => `${tool} ${counts.get(tool)}`);
  const detail = tools.length > 0 ? ` (${tools.join(", ")})` : "";
  console.log(
    `Suppressions: ${suppressions.length} recorded${detail}, ${invalid} invalid; register in reports/suppressions.json.`,
  );
  return invalid;
}

async function main(): Promise<void> {
  const catalog = await loadCatalog();
  const deleted = new Set(listed(["--deleted"]));
  const files = listed(["--cached", "--others", "--exclude-standard"]).filter(
    (file) => !deleted.has(file),
  );
  const texts = await Promise.all(files.map((file) => readText(file)));
  const suppressions = files.flatMap((file, index) => {
    const text = texts[index] ?? null;
    return text === null ? [] : scan(catalog, file, text);
  });
  await writeRegister(suppressions);
  process.exitCode = summarize(suppressions) > 0 ? 1 : 0;
}

await main();
