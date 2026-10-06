import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function pathDirect(): void {
  const input = process.env["INPUT"] ?? "";
  readFileSync(input, "utf8");
}
