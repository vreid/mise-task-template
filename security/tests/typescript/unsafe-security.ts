import * as crypto from "node:crypto";
import hashing, { createHash } from "node:crypto";
// ruleid: poc.typescript.weak-hash
crypto.createHash("md5");
// ok: poc.typescript.weak-hash
crypto.createHash("sha256");
// ruleid: poc.typescript.disabled-tls
const unsafe = { rejectUnauthorized: false };
// ok: poc.typescript.disabled-tls
const safe = { rejectUnauthorized: true };
// ruleid: poc.typescript.weak-hash
createHash("md5");
// ruleid: poc.typescript.weak-hash
hashing.createHash("SHA1");
// ruleid: poc.typescript.weak-hash
hashing.createHash("RSA-MD5");
// ok: poc.typescript.weak-hash
createHash("sha256");
// ok: poc.typescript.weak-hash
hashing.createHash("sha512");
export async function dynamicHash(): Promise<void> {
  const { createHash: digest } = await import("node:crypto");
  const loaded = await import("node:crypto");
  // ruleid: poc.typescript.weak-hash
  loaded.createHash("md5");
  // ok: poc.typescript.weak-hash
  digest("sha256");
}
