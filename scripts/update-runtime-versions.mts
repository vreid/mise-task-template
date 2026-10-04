import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";

const dotnetPath = new URL("../global.json", import.meta.url);
const rustPath = new URL("../rust-toolchain.toml", import.meta.url);
const [dotnetText, rustText] = await Promise.all([
  readFile(dotnetPath, "utf8"),
  readFile(rustPath, "utf8"),
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const dotnet: unknown = JSON.parse(dotnetText);
assert.ok(
  isRecord(dotnet) && isRecord(dotnet["sdk"]),
  "Missing .NET SDK config",
);
const sdk = dotnet["sdk"];
const sdkVersion = sdk["version"];
assert.ok(
  typeof sdkVersion === "string" && /^\d+\.\d+\.\d+$/u.test(sdkVersion),
);
const rustChannel = /^channel = "(\d+\.\d+\.\d+)"$/mu;
const rustVersion = rustText.match(rustChannel)?.[1];
assert.ok(
  rustVersion !== undefined,
  "Expected an exact Rust channel in rust-toolchain.toml",
);

function latest(tool: string, current: string): string {
  const major = current.split(".")[0];
  const stdout = execFileSync("mise", ["latest", `${tool}@${major}`], {
    encoding: "utf8",
    timeout: 60_000,
  });
  const version = stdout.trim();
  assert.ok(
    /^\d+\.\d+\.\d+$/u.test(version),
    `Invalid ${tool} release: ${version}`,
  );
  assert.equal(
    version.split(".")[0],
    major,
    `Unexpected ${tool} major upgrade`,
  );
  return version;
}

// Resolve and validate both versions before changing either native file.
const dotnetVersion = latest("dotnet", sdkVersion);
const rustRelease = latest("rust", rustVersion);
sdk["version"] = dotnetVersion;
await writeFile(dotnetPath, `${JSON.stringify(dotnet, null, 2)}\n`);
await writeFile(
  rustPath,
  rustText.replace(rustChannel, `channel = "${rustRelease}"`),
);
console.log(`Runtime pins: .NET ${dotnetVersion}, Rust ${rustRelease}.`);
