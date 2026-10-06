import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function runCmdSafeConstant(value: string): void {
  execSync(value);
}
