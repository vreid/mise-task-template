// Opengrep fixtures: parsed as source, never executed.
import processes, { execFileSync, execSync } from "node:child_process";

export function vulnerableModule(): void {
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.input-to-shell
  execSync(command);
}

export function safeModule(): void {
  const input = process.env["DEMO_INPUT"] ?? "";
  // ok: poc.typescript.input-to-shell
  execFileSync("/usr/bin/printf", ["%s\n", input]);
}

// Opengrep does not resolve default or awaited dynamic imports to a module;
// the rule matches them through their import statements.
export function vulnerableDefaultImport(): void {
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.input-to-shell
  processes.exec(command);
}

export function safeDefaultImport(): void {
  const input = process.env["DEMO_INPUT"] ?? "";
  // ok: poc.typescript.input-to-shell
  processes.execFileSync("/usr/bin/printf", ["%s\n", input]);
}

export async function vulnerableDynamicImport(): Promise<void> {
  const loaded = await import("node:child_process");
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.input-to-shell
  loaded.execSync(command);
}

export async function vulnerableDynamicDestructuring(): Promise<void> {
  const { spawnSync: run } = await import("node:child_process");
  const { exec } = await import("node:child_process");
  const command = process.env["DEMO_INPUT"] ?? "";
  // ruleid: poc.typescript.input-to-shell
  exec(command);
  // ok: poc.typescript.input-to-shell
  run("/usr/bin/printf", ["%s\n", command]);
}
