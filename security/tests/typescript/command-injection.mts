// Opengrep fixtures: parsed as source, never executed.
import { execFileSync, execSync } from "node:child_process";

export function vulnerableModule(): void {
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.environment-to-shell
  execSync(command);
}

export function safeModule(): void {
  const input = process.env["DEMO_INPUT"] ?? "";
  // ok: poc.typescript.environment-to-shell
  execFileSync("/usr/bin/printf", ["%s\n", input]);
}
