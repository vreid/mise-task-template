import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { digest } from "./report-run.mts";
import { plan } from "./analysis-plan.mts";

const files = [
  "findings.mts",
  "report-run.mts",
  "report-input.mts",
  "analysis-plan.mts",
  "grype-acceptances.mts",
  "analyze.mts",
  "report-trend.mts",
];

export async function fixture(
  action: (directory: string) => Promise<void>,
): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), "report-regression-"));
  try {
    await mkdir(join(directory, "scripts"));
    await mkdir(join(directory, "reports", "logs"), { recursive: true });
    await Promise.all(
      files.map((file) =>
        copyFile(
          new URL(file, import.meta.url),
          join(directory, "scripts", file),
        ),
      ),
    );
    await action(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

export async function prepare(
  directory: string,
  content: string,
  options: Readonly<{ hash?: string; status?: string; output?: string }> = {},
): Promise<void> {
  const output = options.output ?? "sast.json";
  await writeFile(join(directory, "reports", output), content);
  await writeFile(
    join(directory, "reports", "logs", "check.log"),
    "audit.py:1:1: S324 weak cryptography\n",
  );
  const log = await readFile(
    join(directory, "reports", "logs", "check.log"),
    "utf8",
  );
  await writeFile(
    join(directory, "reports", "manifest.json"),
    JSON.stringify({
      run: "new-run",
      commit: "new-commit",
      status: options.status ?? "passed",
      checks: [
        {
          task: "check:python",
          status: options.status ?? "passed",
          outputs: [output],
          log: "logs/check.log",
        },
      ],
      artifacts: {
        [output]: options.hash ?? digest(content),
        "logs/check.log": digest(log),
      },
    }),
  );
}

export async function collect(directory: string) {
  const result = spawnSync(process.execPath, ["scripts/findings.mts"], {
    cwd: directory,
    encoding: "utf8",
  });
  const report: unknown = JSON.parse(
    await readFile(join(directory, "reports", "findings.json"), "utf8"),
  );
  return { status: result.status, report };
}

export function initializeGit(directory: string): void {
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
}

export async function stubTasks(directory: string): Promise<void> {
  const tasks = Object.fromEntries(
    plan("check").map((check) => [
      check.task,
      { cmds: [`node stub.mjs ${check.task}`] },
    ]),
  );
  tasks["check:findings"] = { cmds: ["node scripts/findings.mts"] };
  await writeFile(
    join(directory, "Taskfile.yml"),
    JSON.stringify({ version: "3", tasks }),
  );
  await writeFile(
    join(directory, "stub-outputs.json"),
    JSON.stringify(
      Object.fromEntries(
        plan("check").map((check) => [check.task, check.outputs]),
      ),
    ),
  );
  const code =
    'import fs from "node:fs";\nconst task=process.argv[2];\nconst outputs=JSON.parse(fs.readFileSync("stub-outputs.json", "utf8"))[task];\nfor(const name of outputs) {\n const value = ["sloc.json", "secrets.json"].includes(name) ? [] : {results:[], matches:[], ignoredMatches:[], suppressions:[], run:{targets:[]}};\n fs.writeFileSync("reports/"+name, name.endsWith(".json") ? JSON.stringify(value) : "NLOC,CCN\\n");\n}\nif(task === "check:python") { console.error("audit.py:1:1: S324 weak cryptography"); process.exitCode=1; }\n';
  await writeFile(join(directory, "stub.mjs"), code);
}
