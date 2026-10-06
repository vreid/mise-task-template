import { runPathSinkWrapperFile } from "./util-path-sink-wrapper-file.js";

export function pathSinkWrapperFile(): void {
  runPathSinkWrapperFile(process.env["INPUT"] ?? "");
}
