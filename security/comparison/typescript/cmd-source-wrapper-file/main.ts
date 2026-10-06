import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readCmdSourceWrapperFile } from "./util-cmd-source-wrapper-file.js";

export function cmdSourceWrapperFile(): void {
  execSync(readCmdSourceWrapperFile());
}
