import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function cmdSafeApi(): void {
  const input = process.env["INPUT"] ?? "";
  execFileSync("/usr/bin/printf", ["%s\n", input]);
}
