import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function runPathSinkWrapperFile(value: string): void {
  readFileSync(value, "utf8");
}
