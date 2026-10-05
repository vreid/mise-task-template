import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Collects the findings in reports/ into reports/findings.json, each classified
// high, medium, or low. Tools with their own severity keep it; everything else
// is low. Accepted findings stay listed, with the reason they were accepted.

type Severity = "high" | "medium" | "low";

interface Finding {
  readonly tool: string;
  readonly rule: string;
  readonly location: string;
  readonly severity: Severity;
  readonly native: string | null;
  readonly state: "open" | "accepted";
  readonly reason: string | null;
}

const reports = fileURLToPath(new URL("../reports/", import.meta.url));

/** Follows a path of keys and indexes through parsed JSON. */
function at(value: unknown, ...path: readonly (string | number)[]): unknown {
  let current = value;
  for (const key of path) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    const next: unknown = Reflect.get(current, key);
    current = next;
  }
  return current;
}

const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";
const list = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

function classify(native: string): Severity {
  const level = native.toLowerCase();
  if (["critical", "high", "error"].includes(level)) {
    return "high";
  }
  return ["medium", "warning", "moderate"].includes(level) ? "medium" : "low";
}

async function load(name: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(join(reports, name), "utf8"));
  } catch {
    return undefined;
  }
}

function finding(tool: string, rule: string, location: string, native = "") {
  const result: Finding = {
    tool,
    rule,
    location,
    severity: native === "" ? "low" : classify(native),
    native: native === "" ? null : native,
    state: "open",
    reason: null,
  };
  return result;
}

function opengrep(report: unknown): Finding[] {
  return list(at(report, "results")).map((result) => {
    const location = `${text(at(result, "path"))}:${text(at(result, "start", "line"))}`;
    const native = text(at(result, "extra", "severity"));
    return finding("opengrep", text(at(result, "check_id")), location, native);
  });
}

function grypeMatch(match: unknown, reason: string | null): Finding {
  const name = text(at(match, "artifact", "name"));
  const location = `${name}@${text(at(match, "artifact", "version"))}`;
  const native = text(at(match, "vulnerability", "severity"));
  const base = finding(
    "grype",
    text(at(match, "vulnerability", "id")),
    location,
    native,
  );
  return reason === null ? base : { ...base, state: "accepted", reason };
}

function grype(report: unknown): Finding[] {
  const open = list(at(report, "matches")).map((match) =>
    grypeMatch(match, null),
  );
  const accepted = list(at(report, "ignoredMatches")).map((match) => {
    const reason = text(at(match, "appliedIgnoreRules", 0, "reason"));
    return grypeMatch(match, reason === "" ? "fix not published" : reason);
  });
  return [...open, ...accepted];
}

function betterleaks(report: unknown): Finding[] {
  return list(report).map((leak) => {
    const location = `${text(at(leak, "File"))}:${text(at(leak, "StartLine"))}`;
    return finding("betterleaks", text(at(leak, "RuleID")), location);
  });
}

function grant(report: unknown): Finding[] {
  const path = ["run", "targets", 0, "evaluation", "findings", "packages"];
  return list(at(report, ...path))
    .filter((entry) => at(entry, "decision") === "deny")
    .map((entry) => {
      const licenses = list(at(entry, "licenses")).map((license) =>
        text(at(license, "id")),
      );
      const rule = licenses.length > 0 ? licenses.join(" ") : "no license";
      const location = `${text(at(entry, "name"))}@${text(at(entry, "version"))}`;
      return finding("grant", rule, location);
    });
}

function register(report: unknown): Finding[] {
  return list(at(report, "suppressions"))
    .filter((entry) => list(at(entry, "problems")).length > 0)
    .map((entry) => {
      const location = `${text(at(entry, "file"))}:${text(at(entry, "line"))}`;
      return finding("suppressions", text(at(entry, "tool")), location);
    });
}

async function main(): Promise<void> {
  const findings = [
    ...opengrep(await load("sast.json")),
    ...opengrep(await load("sast-modules.json")),
    ...grype(await load("vulnerabilities.json")),
    ...betterleaks(await load("secrets.json")),
    ...betterleaks(await load("secrets-history.json")),
    ...grant(await load("licenses.json")),
    ...register(await load("suppressions.json")),
  ];
  const manifest = await load("manifest.json");
  const commit = text(at(manifest, "commit"));
  const report = { commit: commit === "" ? null : commit, findings };
  await writeFile(
    join(reports, "findings.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  const count = (severity: Severity, state: Finding["state"]) =>
    findings.filter(
      (entry) => entry.severity === severity && entry.state === state,
    ).length;
  const summary = (["high", "medium", "low"] as const)
    .map(
      (level) => `${level} ${count(level, "open")}+${count(level, "accepted")}`,
    )
    .join(", ");
  console.log(
    `Findings (open+accepted): ${summary}; details in reports/findings.json.`,
  );
}

await main();
