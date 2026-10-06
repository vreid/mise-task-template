import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function pathSafeApi(): void {
  const input = process.env["INPUT"] ?? "";
  if (["a.txt", "b.txt"].includes(input)) {
    readFileSync(input, "utf8");
  }
}
