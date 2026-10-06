export function readPathSourceWrapperFile(): string {
  return process.env["INPUT"] ?? "";
}
