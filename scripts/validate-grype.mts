import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { acceptanceReason } from "./grype-acceptances.mts";
import { at, list, text } from "./report-input.mts";

const report: unknown = JSON.parse(
  await readFile(
    new URL("../reports/vulnerabilities.json", import.meta.url),
    "utf8",
  ),
);
assert.ok(Array.isArray(at(report, "matches")), "Invalid Grype report");
for (const match of list(at(report, "ignoredMatches"))) {
  if (acceptanceReason(match) === null) {
    console.error(
      `Grype acceptance needs a recorded reason: ${text(at(match, "vulnerability", "id"))}`,
    );
    process.exitCode = 1;
  }
}
