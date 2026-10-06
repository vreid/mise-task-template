import { at, list, text } from "./report-input.mts";

// The analyzers in the comparison and how to read their raw output.

export interface Hit {
  readonly path: string;
  readonly line: number;
  readonly rule: string;
}

export interface Source {
  readonly file: string;
  readonly language: string | null;
  readonly read: (content: string) => readonly Hit[];
}

export interface Tool {
  readonly name: string;
  readonly sources: readonly Source[];
}

export const languages = [
  "typescript",
  "python",
  "go",
  "csharp",
  "rust",
  "c",
  "cpp",
] as const;

export function sarif(content: string): Hit[] {
  return list(at(JSON.parse(content), "runs")).flatMap((run) =>
    list(at(run, "results")).map((result) => {
      const location = at(result, "locations", 0, "physicalLocation");
      return {
        path: text(at(location, "artifactLocation", "uri")),
        line: Number(text(at(location, "region", "startLine"))),
        rule: text(at(result, "ruleId")),
      };
    }),
  );
}

function opengrep(content: string): Hit[] {
  return list(at(JSON.parse(content), "results")).map((result) => ({
    path: text(at(result, "path")),
    line: Number(text(at(result, "start", "line"))),
    rule: text(at(result, "check_id")),
  }));
}

function ruff(content: string): Hit[] {
  return list(JSON.parse(content)).map((entry) => ({
    path: text(at(entry, "filename")),
    line: Number(text(at(entry, "location", "row"))),
    rule: text(at(entry, "code")),
  }));
}

function gosec(content: string): Hit[] {
  return list(at(JSON.parse(content), "Issues")).map((issue) => ({
    path: text(at(issue, "Pos", "Filename")),
    line: Number(text(at(issue, "Pos", "Line"))),
    rule: text(at(issue, "Text")).split(":")[0] ?? "",
  }));
}

// Security-relevant .NET analyzer and obsoletion diagnostics only.
function dotnet(content: string): Hit[] {
  const pattern =
    /^(.+?)\((\d+),\d+\): warning (CA(?:2100|23\d\d|30\d\d|31\d\d|5\d{3})|SYSLIB\d+):/gmu;
  const hits: Hit[] = [];
  for (const match of content.matchAll(pattern))
    hits.push({
      path: match[1] ?? "",
      line: Number(match[2]),
      rule: match[3] ?? "",
    });
  return hits;
}

const each = (prefix: string, read: Source["read"], suffix = ".sarif") =>
  languages.map((language) => ({
    file: `${prefix}-${language}${suffix}`,
    language,
    read,
  }));
const native = (mode: string) =>
  ["c", "cpp"].map((language) => ({
    file: `clang-${mode}-${language}.sarif`,
    language,
    read: sarif,
  }));

export const tools: readonly Tool[] = [
  {
    name: "Opengrep",
    sources: [
      { file: "opengrep-default.json", language: null, read: opengrep },
    ],
  },
  {
    name: "Opengrep intrafile",
    sources: [
      { file: "opengrep-intrafile.json", language: null, read: opengrep },
    ],
  },
  {
    name: "Ruff/gosec/.NET",
    sources: [
      { file: "ruff.json", language: "python", read: ruff },
      { file: "gosec.json", language: "go", read: gosec },
      { file: "dotnet.log", language: "csharp", read: dotnet },
    ],
  },
  { name: "Clang per file", sources: native("tu") },
  { name: "Clang CTU", sources: native("ctu") },
  {
    name: "CodeQL default",
    sources: each("codeql", sarif, "-default.sarif"),
  },
  { name: "CodeQL local", sources: each("codeql", sarif, "-local.sarif") },
];
