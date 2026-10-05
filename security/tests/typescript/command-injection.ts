// Opengrep fixtures: parsed as source, never executed.
import * as childProcess from "node:child_process";
import {
  execFileSync,
  execSync as runShell,
  spawnSync,
} from "node:child_process";

export function vulnerable(): void {
  const input = process.env["DEMO_INPUT"] ?? "";
  const command = "printf '%s\\n' " + input;
  // ruleid: poc.typescript.input-to-shell
  runShell(command);
}

export function vulnerableNamespace(): void {
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.input-to-shell
  childProcess.exec(command);
}

export function safeArguments(): void {
  const input = process.env["DEMO_INPUT"] ?? "";
  // ok: poc.typescript.input-to-shell
  execFileSync("/usr/bin/printf", ["%s\n", input]);
}

export function constantCommand(): void {
  // ok: poc.typescript.input-to-shell
  runShell("printf '%s\\n' fixed");
}

const otherApi = { execSync: (value: string): string => value };

export function unrelatedApi(): string {
  const input = process.env["DEMO_INPUT"] ?? "";
  // ok: poc.typescript.input-to-shell
  return otherApi.execSync(input);
}

export function viaShellArguments(): void {
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.input-to-shell
  spawnSync("sh", ["-c", command]);
}

export function viaShellOption(): void {
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.input-to-shell
  spawnSync(command, { shell: true });
}

export function viaArguments(): void {
  // ruleid: poc.typescript.input-to-shell
  runShell(`ls ${process.argv[2] ?? ""}`);
}

export function safeSpawn(): void {
  const input = process.argv[2] ?? "";
  // ok: poc.typescript.input-to-shell
  spawnSync("/usr/bin/printf", ["%s\n", input]);
}
