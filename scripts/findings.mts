import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { reports } from "./report-run.mts";
import { at, text, list, inputsOf } from "./report-input.mts";
import { acceptanceReason } from "./grype-acceptances.mts";

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
  readonly details?: string;
}

function classify(native: string): Severity {
  const level = native.toLowerCase();
  if (["critical", "high", "error"].includes(level)) {
    return "high";
  }
  return ["medium", "warning", "moderate"].includes(level) ? "medium" : "low";
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
    return grypeMatch(match, acceptanceReason(match));
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

function summarize(findings: readonly Finding[]): void {
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

/** Preserve individual located diagnostics and a complete log for other failures. */
function checkFindings(
  manifest: unknown,
  diagnostics: readonly (readonly [string, string])[],
): Finding[] {
  const findings: Finding[] = [];
  for (const [task, output] of diagnostics) {
    const log = `logs/${task.replaceAll(":", "-")}.log`;
    const rows = [...new Set(output.split("\n"))];
    const located = rows.filter((row) =>
      /^.+?(?::\d+(?::\d+)?|\(\d+,\d+\)):?\s+\S/u.test(row),
    );
    for (const row of located)
      findings.push({ ...finding("check", task, log), details: row });
    const check = list(at(manifest, "checks")).find(
      (entry) => at(entry, "task") === task,
    );
    if (located.length === 0 && at(check, "status") === "failed") {
      findings.push({ ...finding("check", task, log), details: output });
    }
  }
  return findings;
}

async function main(): Promise<void> {
  const inputs = await inputsOf();
  const problems = [...inputs.problems];
  const load = (name: string) => inputs.data.get(name);
  const findings: Finding[] = [
    ...opengrep(load("sast.json")),
    ...opengrep(load("sast-modules.json")),
    ...grype(load("vulnerabilities.json")),
    ...betterleaks(load("secrets.json")),
    ...betterleaks(load("secrets-history.json")),
    ...grant(load("licenses.json")),
    ...register(load("suppressions.json")),
    ...checkFindings(inputs.manifest, Array.from(inputs.diagnostics)),
  ];
  const ignored = list(at(load("vulnerabilities.json"), "ignoredMatches"));
  for (const match of ignored) {
    if (acceptanceReason(match) === null)
      problems.push(
        `Grype acceptance lacks a reason: ${text(at(match, "vulnerability", "id"))}`,
      );
  }
  for (const problem of problems) {
    findings.push({
      ...finding("reporting", "incomplete-evidence", "manifest.json", "high"),
      details: problem,
    });
  }
  const complete = problems.length === 0;
  const report = {
    run: at(inputs.manifest, "run"),
    commit: at(inputs.manifest, "commit"),
    complete,
    status: complete ? at(inputs.manifest, "status") : "incomplete",
    checks: at(inputs.manifest, "checks"),
    findings,
  };
  process.exitCode =
    complete && at(inputs.manifest, "status") === "passed" ? 0 : 1;
  await writeFile(
    join(reports, "findings.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  summarize(findings);
}

await main();
