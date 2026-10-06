import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function readCmdSourceWrapper(): string {
  return process.env["INPUT"] ?? "";
}

export function cmdSourceWrapper(): void {
  execSync(readCmdSourceWrapper());
}
