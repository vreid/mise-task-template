import { runCmdSinkWrapperFile } from "./util-cmd-sink-wrapper-file.js";

export function cmdSinkWrapperFile(): void {
  runCmdSinkWrapperFile(process.env["INPUT"] ?? "");
}
