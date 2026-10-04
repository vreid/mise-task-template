// Opengrep fixtures: parsed as source, never executed.
import * as childProcess from "node:child_process";
import { execFileSync, execSync as runShell } from "node:child_process";

export function vulnerable(): void {
  const input = process.env["DEMO_INPUT"] ?? "";
  const command = "printf '%s\\n' " + input;
  // ruleid: poc.typescript.environment-to-shell
  runShell(command);
}

export function vulnerableNamespace(): void {
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.environment-to-shell
  childProcess.exec(command);
}

export function safeArguments(): void {
  const input = process.env["DEMO_INPUT"] ?? "";
  // ok: poc.typescript.environment-to-shell
  execFileSync("/usr/bin/printf", ["%s\n", input]);
}

export function constantCommand(): void {
  // ok: poc.typescript.environment-to-shell
  runShell("printf '%s\\n' fixed");
}

const otherApi = { execSync: (value: string): string => value };

export function unrelatedApi(): string {
  const input = process.env["DEMO_INPUT"] ?? "";
  // ok: poc.typescript.environment-to-shell
  return otherApi.execSync(input);
}
