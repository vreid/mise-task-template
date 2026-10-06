import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function cmdDirect(): void {
  const input = process.env["INPUT"] ?? "";
  execSync(input);
}
