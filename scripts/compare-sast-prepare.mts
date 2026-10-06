import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Writes the build files the analyzers need into a copy of the corpus. They
// stay out of the repository so Syft does not inventory the corpus.

async function cases(directory: string): Promise<string[]> {
  const names: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true }))
    if (entry.isDirectory() && !entry.name.startsWith("."))
      names.push(entry.name);
  return names.toSorted();
}

async function sources(directory: string, suffix: string): Promise<string[]> {
  const entries = await readdir(directory, { recursive: true });
  return entries
    .filter((entry) => entry.endsWith(suffix))
    .map((entry) => join(directory, entry))
    .toSorted();
}

async function go(corpus: string): Promise<void> {
  const directory = join(corpus, "go");
  await writeFile(
    join(directory, "go.mod"),
    "module example.com/comparison\n\ngo 1.27.0\n",
  );
  await writeFile(
    join(directory, "build.sh"),
    'cd "$(dirname "$0")" && go build ./...\n',
  );
}

async function rust(corpus: string): Promise<void> {
  const directory = join(corpus, "rust");
  const binaries = (await cases(directory)).map(
    (name) => `[[bin]]\nname = "${name}"\npath = "${name}/main.rs"\n`,
  );
  const manifest = `[package]\nname = "comparison"\nversion = "0.0.0"\nedition = "2024"\npublish = false\n\n${binaries.join("\n")}`;
  await writeFile(join(directory, "Cargo.toml"), manifest);
}

async function csharp(corpus: string): Promise<void> {
  const project = [
    '<Project Sdk="Microsoft.NET.Sdk">',
    "  <PropertyGroup>",
    "    <TargetFramework>net10.0</TargetFramework>",
    "    <OutputType>Library</OutputType>",
    "    <Nullable>enable</Nullable>",
    "  </PropertyGroup>",
    "</Project>",
    "",
  ].join("\n");
  await writeFile(join(corpus, "csharp", "Comparison.csproj"), project);
}

interface Command {
  readonly directory: string;
  readonly file: string;
  readonly command: string;
}

function quote(value: string): string {
  return `'${value.replaceAll("'", String.raw`'\''`)}'`;
}

async function native(corpus: string, language: "c" | "cpp"): Promise<void> {
  const directory = join(corpus, language);
  const compiler = language === "c" ? "clang" : "clang++";
  const standard = language === "c" ? "-std=c17" : "-std=c++20";
  const sdk = process.env["SDKROOT"];
  const sysroot = sdk === undefined || sdk === "" ? [] : ["-isysroot", sdk];
  const files = await sources(directory, `.${language}`);
  const commands = files.map((file): Command => {
    const folder = join(file, "..");
    const flags = [standard, ...sysroot, "-I", folder, "-c", file];
    const command = [compiler, ...flags, "-o", "/dev/null"]
      .map((part) => quote(part))
      .join(" ");
    return { directory: folder, file, command };
  });
  await writeFile(
    join(directory, "compile_commands.json"),
    `${JSON.stringify(commands, null, 2)}\n`,
  );
  // CodeQL treats one database as one program, so every case, with its own
  // main, gets its own build script and database.
  await mkdir(join(directory, ".build"), { recursive: true });
  await Promise.all(
    (await cases(directory)).map(async (name) => {
      const own = commands.filter((entry: Command) =>
        entry.file.startsWith(join(directory, name, "/")),
      );
      const script = own.map((entry: Command) => entry.command).join("\n");
      await writeFile(
        join(directory, ".build", `${name}.sh`),
        `set -e\n${script}\n`,
      );
    }),
  );
}

export async function prepare(corpus: string): Promise<void> {
  await Promise.all([
    go(corpus),
    rust(corpus),
    csharp(corpus),
    native(corpus, "c"),
    native(corpus, "cpp"),
  ]);
}
