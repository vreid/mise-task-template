import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { at, list } from "./report-input.mts";
import { digest } from "./report-run.mts";
import {
  fixture,
  prepare,
  collect,
  initializeGit,
  stubTasks,
} from "./report-test-fixture.mts";

await test("a failing linter cannot prevent independent scans or lose its evidence", () =>
  fixture(async (directory) => {
    initializeGit(directory);
    await stubTasks(directory);
    const run = spawnSync(process.execPath, ["scripts/analyze.mts", "check"], {
      cwd: directory,
      encoding: "utf8",
    });
    assert.equal(run.status, 1, run.stderr);
    const report: unknown = JSON.parse(
      await readFile(join(directory, "reports", "findings.json"), "utf8"),
    );
    assert.equal(at(report, "complete"), true);
    const checks = list(at(report, "checks"));
    assert.equal(
      at(
        checks.find((entry) => at(entry, "task") === "check:python"),
        "status",
      ),
      "failed",
    );
    assert.equal(
      at(
        checks.find((entry) => at(entry, "task") === "check:secrets"),
        "status",
      ),
      "passed",
    );
    assert.match(
      JSON.stringify(at(report, "findings")),
      /S324 weak cryptography/u,
    );
  }));

await test("trend comparisons reject incomplete evidence", () =>
  fixture(async (directory) => {
    await prepare(directory, '{"results":[]}', { status: "skipped" });
    await collect(directory);
    const run = spawnSync(process.execPath, ["scripts/report-trend.mts"], {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, REPORT_BASELINE: join(directory, "reports") },
    });
    assert.equal(run.status, 0, run.stderr);
    assert.match(
      await readFile(join(directory, "reports", "trend.md"), "utf8"),
      /No comparison:.*incomplete/u,
    );
  }));

await test("malformed JSON and wrong report schemas fail visibly", async () => {
  await Promise.all(
    ["{invalid", "{}"].map((content) =>
      fixture(async (directory) => {
        await prepare(directory, content);
        const { status, report } = await collect(directory);
        assert.equal(status, 1);
        assert.equal(at(report, "complete"), false);
        assert.ok(
          list(at(report, "findings")).some(
            (finding) => at(finding, "tool") === "reporting",
          ),
        );
      }),
    ),
  );
});

await test("unattested and changed reports cannot be relabelled with a new commit", async () => {
  await Promise.all(
    ["", digest("older content")].map((hash) =>
      fixture(async (directory) => {
        await prepare(directory, '{"results":[]}', { hash });
        const { status, report } = await collect(directory);
        assert.equal(status, 1);
        assert.equal(at(report, "complete"), false);
      }),
    ),
  );
});

await test("failed language checks keep classified diagnostics", () =>
  fixture(async (directory) => {
    await prepare(directory, '{"results":[]}', { status: "failed" });
    const { status, report } = await collect(directory);
    assert.equal(status, 1);
    assert.equal(at(report, "complete"), true);
    const finding = list(at(report, "findings")).find(
      (entry) => at(entry, "tool") === "check",
    );
    assert.equal(at(finding, "severity"), "low");
    assert.match(String(at(finding, "details")), /S324 weak cryptography/u);
  }));

await test("skipped scanners are incomplete evidence", () =>
  fixture(async (directory) => {
    await prepare(directory, '{"results":[]}', { status: "skipped" });
    const { status, report } = await collect(directory);
    assert.equal(status, 1);
    assert.equal(at(report, "complete"), false);
  }));

await test("reasonless acceptance stays open even when upstream has a fix", () =>
  fixture(async (directory) => {
    const match = {
      artifact: { name: "package", version: "1" },
      vulnerability: {
        id: "TEST",
        severity: "High",
        fix: { state: "fixed", versions: ["2"] },
      },
      appliedIgnoreRules: [{}],
    };
    await prepare(
      directory,
      JSON.stringify({ matches: [], ignoredMatches: [match] }),
      { output: "vulnerabilities.json" },
    );
    const { status, report } = await collect(directory);
    assert.equal(status, 1);
    const finding = list(at(report, "findings")).find(
      (entry) => at(entry, "tool") === "grype",
    );
    assert.equal(at(finding, "state"), "open");
    assert.equal(at(finding, "reason"), null);
  }));

await test("initializing another run removes stale evidence and changes run identity", () =>
  fixture(async (directory) => {
    execFileSync("git", ["init", "-q"], { cwd: directory });
    execFileSync(
      "git",
      [
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "-c",
        "commit.gpgsign=false",
        "commit",
        "--allow-empty",
        "--no-verify",
        "-qm",
        "fixture",
      ],
      { cwd: directory },
    );
    await prepare(directory, '{"results":[]}');
    const code =
      'import { initialize } from "./scripts/report-run.mts"; await initialize("check");';
    execFileSync(process.execPath, ["--input-type=module", "-e", code], {
      cwd: directory,
    });
    await assert.rejects(readFile(join(directory, "reports", "sast.json")));
    const manifest: unknown = JSON.parse(
      await readFile(join(directory, "reports", "manifest.json"), "utf8"),
    );
    assert.notEqual(at(manifest, "run"), "new-run");
    assert.ok(
      list(at(manifest, "checks")).every(
        (entry) => at(entry, "status") === "pending",
      ),
    );
  }));
