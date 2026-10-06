import { execFileSync, execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readPathSourceWrapperFile } from "./util-path-source-wrapper-file.js";

export function pathSourceWrapperFile(): void {
  readFileSync(readPathSourceWrapperFile(), "utf8");
}
