import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { at, list, text } from "./report-input.mts";

// Merges one language's compile commands into build/compile_commands.json so
// clangd in an editor sees the same flags as scripts/c-cpp.sh. Usage:
// compile-commands.mts <compiler> <flag>... -- <source>...

interface Command {
  readonly directory: string;
  readonly file: string;
  readonly arguments: readonly string[];
}

const output = "build/compile_commands.json";
const separator = process.argv.indexOf("--");
const [compiler = "", ...flags] = process.argv.slice(2, separator);
const sources = process.argv.slice(separator + 1);
if (separator < 0 || compiler === "" || sources.length === 0)
  throw new Error("Expected <compiler> <flag>... -- <source>...");

async function existing(): Promise<readonly unknown[]> {
  try {
    return list(JSON.parse(await readFile(output, "utf8")));
  } catch {
    return [];
  }
}

const directory = process.cwd();
const files = new Set(sources.map((source) => resolve(source)));
const commands: Command[] = [...files].map((file) => ({
  directory,
  file,
  arguments: [compiler, ...flags, "-c", file],
}));
const kept = (await existing()).filter(
  (entry) => !files.has(text(at(entry, "file"))),
);
await mkdir("build", { recursive: true });
await writeFile(output, `${JSON.stringify([...kept, ...commands], null, 2)}\n`);
console.log(`Wrote ${commands.length} entries to ${output}.`);
