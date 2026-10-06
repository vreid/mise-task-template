export function readCmdSourceWrapperFile(): string {
  return process.env["INPUT"] ?? "";
}
