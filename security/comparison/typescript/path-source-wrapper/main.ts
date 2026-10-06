import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

function readPathSourceWrapper(): string {
  return process.env["INPUT"] ?? "";
}

export function pathSourceWrapper(): void {
  readFileSync(readPathSourceWrapper(), "utf8");
}
