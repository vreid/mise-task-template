import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function runPathSinkWrapper(value: string): void {
  readFileSync(value, "utf8");
}

export function pathSinkWrapper(): void {
  runPathSinkWrapper(process.env["INPUT"] ?? "");
}
