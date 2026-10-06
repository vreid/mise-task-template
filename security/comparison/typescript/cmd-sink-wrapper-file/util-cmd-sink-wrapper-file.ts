import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function runCmdSinkWrapperFile(value: string): void {
  execSync(value);
}
