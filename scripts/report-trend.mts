import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { at, list, text } from "./report-input.mts";
import { reports } from "./report-run.mts";

interface Snapshot {
  readonly commit: string;
  readonly run: string;
  readonly platform: string;
  readonly complete: boolean;
  readonly open: Readonly<Record<string, number>>;
  readonly accepted: number;
}

async function snapshot(directory: string): Promise<Snapshot> {
  const findings: unknown = JSON.parse(
    await readFile(join(directory, "findings.json"), "utf8"),
  );
  const manifest: unknown = JSON.parse(
    await readFile(join(directory, "manifest.json"), "utf8"),
  );
  assert.equal(
    at(findings, "run"),
    at(manifest, "run"),
    "Run identity mismatch",
  );
  assert.equal(
    at(findings, "commit"),
    at(manifest, "commit"),
    "Commit identity mismatch",
  );
  const entries = list(at(findings, "findings"));
  const open = Object.fromEntries(
    ["high", "medium", "low"].map((severity) => [
      severity,
      entries.filter(
        (entry) =>
          at(entry, "severity") === severity && at(entry, "state") === "open",
      ).length,
    ]),
  );
  return {
    commit: text(at(manifest, "commit")),
    run: text(at(manifest, "run")),
    platform: text(at(manifest, "platform")),
    complete: at(findings, "complete") === true,
    open,
    accepted: entries.filter((entry) => at(entry, "state") === "accepted")
      .length,
  };
}

function comparison(before: Snapshot, after: Snapshot): string {
  if (!before.complete || !after.complete)
    return "No comparison: one analysis has incomplete evidence.";
  if (before.platform !== after.platform)
    return "No comparison: platforms differ.";
  const rows = ["high", "medium", "low"].map((severity) => {
    const from = before.open[severity] ?? 0;
    const to = after.open[severity] ?? 0;
    return `| ${severity} | ${from} | ${to} | ${to - from} |`;
  });
  return [
    `Baseline: \`${before.commit}\`; current: \`${after.commit}\`.`,
    "",
    "| Open findings | Baseline | Current | Change |",
    "| --- | ---: | ---: | ---: |",
    ...rows,
    "",
    `Accepted findings: ${before.accepted} → ${after.accepted}.`,
    "",
    "Observed results across runs; changes in rules, tools, vulnerability databases, or source can affect these counts.",
  ].join("\n");
}

const baseline = process.env["REPORT_BASELINE"];
const current = await snapshot(reports);
const previous = baseline === undefined ? null : await snapshot(baseline);
const markdown =
  previous === null
    ? "No comparable baseline artifact is available yet.\n"
    : `${comparison(previous, current)}\n`;
await writeFile(join(reports, "trend.md"), markdown);
await writeFile(
  join(reports, "trend.json"),
  `${JSON.stringify({ current, previous }, null, 2)}\n`,
);
console.log(markdown);
