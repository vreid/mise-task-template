import { access, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { at, list } from "./report-input.mts";
import { markdown } from "./compare-sast-table.mts";
import type { Tool } from "./compare-sast-tools.mts";
import { languages, sarif, tools } from "./compare-sast-tools.mts";

// Scores raw analyzer output against the comparison corpus (one case per
// directory; a finding anywhere in a case counts) and against the line
// annotations of the Opengrep fixtures.

export interface Case {
  readonly language: string;
  readonly name: string;
  readonly vulnerable: boolean;
  /** Rule IDs reported per tool; null when the tool did not run here. */
  readonly tools: Readonly<Record<string, readonly string[] | null>>;
}

/** The case directory and language a reported path belongs to. */
function locate(path: string, language: string | null) {
  const parts = path.split(/[\\/]/u);
  const index = parts.findIndex((part) => /^(?:cmd|path)-[a-z-]+$/u.test(part));
  if (index < 0) return null;
  const owner = language ?? parts[index - 1] ?? "";
  return { language: owner, name: parts[index] ?? "" };
}

async function contentOf(path: string): Promise<string | null> {
  try {
    await access(path);
  } catch {
    return null;
  }
  return readFile(path, "utf8");
}

async function hitsOf(raw: string, tool: Tool) {
  const found = new Map<string, Set<string>>();
  const ran = new Set<string>();
  const loaded = await Promise.all(
    tool.sources.map(async (source) => ({
      source,
      content: await contentOf(join(raw, source.file)),
    })),
  );
  for (const { source, content } of loaded) {
    if (content === null) continue;
    for (const language of source.language === null
      ? languages
      : [source.language])
      ran.add(language);
    for (const hit of source.read(content)) {
      const where = locate(hit.path, source.language);
      if (where === null) continue;
      const key = `${where.language}/${where.name}`;
      found.set(key, (found.get(key) ?? new Set()).add(hit.rule));
    }
  }
  return { found, ran };
}

interface Entry {
  readonly language: string;
  readonly name: string;
}

async function corpus(): Promise<Entry[]> {
  const listed = await Promise.all(
    languages.map(async (language) => {
      const names = await readdir(join("security/comparison", language));
      return names.toSorted().map((name): Entry => ({ language, name }));
    }),
  );
  return listed.flat();
}

export async function scoreCorpus(raw: string): Promise<Case[]> {
  const found = await Promise.all(tools.map((tool) => hitsOf(raw, tool)));
  return (await corpus()).map(({ language, name }: Entry) => ({
    language,
    name,
    vulnerable: !name.split("-").slice(1).join("-").startsWith("safe"),
    tools: Object.fromEntries(
      tools.map((tool, index) => {
        const result = found[index];
        if (result === undefined || !result.ran.has(language))
          return [tool.name, null];
        const rules = result.found.get(`${language}/${name}`) ?? [];
        return [tool.name, [...rules].toSorted()];
      }),
    ),
  }));
}

export interface Annotation {
  readonly language: string;
  readonly file: string;
  readonly line: number;
  readonly vulnerable: boolean;
}

/** Each ruleid:/ok: comment applies to the next line that is not one. */
function annotationsIn(language: string, file: string, content: string) {
  const lines = content.split("\n");
  const found: Annotation[] = [];
  for (const [index, line] of lines.entries()) {
    const marker = /\b(ruleid|ok):/u.exec(line)?.[1];
    if (marker === undefined) continue;
    const offset = lines
      .slice(index + 1)
      .findIndex((next) => !/\b(?:ruleid|ok):/u.test(next));
    const vulnerable = marker === "ruleid";
    found.push({ language, file, line: index + 2 + offset, vulnerable });
  }
  return found;
}

export async function annotations(): Promise<Annotation[]> {
  const files = await Promise.all(
    languages.map(async (language) => {
      const directory = join("security/tests", language);
      const names = await readdir(directory);
      return Promise.all(
        names.map(async (name) =>
          annotationsIn(
            language,
            name,
            await readFile(join(directory, name), "utf8"),
          ),
        ),
      );
    }),
  );
  return files.flat(2);
}

export async function fixtureHits(raw: string, model: string) {
  const available = new Set(await readdir(raw));
  const hits = await Promise.all(
    languages.map(async (language) => {
      const file = `fixtures-codeql-${language}-${model}.sarif`;
      if (!available.has(file)) return [];
      const content = await readFile(join(raw, file), "utf8");
      return sarif(content).map(
        (hit) => `${language}/${basename(hit.path)}:${hit.line}`,
      );
    }),
  );
  return hits.flat();
}

/** Combines the per-case C/C++ CodeQL runs into one SARIF file per model. */
async function mergeCases(raw: string): Promise<void> {
  const merges = ["c", "cpp"].flatMap((language) =>
    ["default", "local"].map(async (model) => {
      const directory = join(raw, `codeql-${language}`);
      const names = await readdir(directory).catch(() => []);
      const own = names.filter((name) => name.endsWith(`-${model}.sarif`));
      if (own.length === 0) return;
      const documents = await Promise.all(
        own.map(async (name) => {
          const parsed: unknown = JSON.parse(
            await readFile(join(directory, name), "utf8"),
          );
          return parsed;
        }),
      );
      const runs = documents.flatMap((document) => list(at(document, "runs")));
      await writeFile(
        join(raw, `codeql-${language}-${model}.sarif`),
        JSON.stringify({ version: "2.1.0", runs }),
      );
    }),
  );
  await Promise.all(merges);
}

export async function score(out: string): Promise<void> {
  const raw = join(out, "raw");
  await mergeCases(raw);
  const cases = await scoreCorpus(raw);
  const expected = await annotations();
  const models = await Promise.all(
    ["default", "local"].map(async (model) => ({
      model,
      hits: await fixtureHits(raw, model),
    })),
  );
  const versions = await readFile(join(raw, "versions.txt"), "utf8");
  await writeFile(
    join(out, "results.json"),
    `${JSON.stringify({ versions, cases }, null, 2)}\n`,
  );
  const report = markdown(cases, expected, models, versions);
  await writeFile(join(out, "results.md"), report);
  console.log(report);
}
