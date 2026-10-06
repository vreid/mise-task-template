import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function runCmdSinkWrapper(value: string): void {
  execSync(value);
}

export function cmdSinkWrapper(): void {
  runCmdSinkWrapper(process.env["INPUT"] ?? "");
}
