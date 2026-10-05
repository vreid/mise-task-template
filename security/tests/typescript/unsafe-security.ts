import * as crypto from "node:crypto";
// ruleid: poc.typescript.weak-hash
crypto.createHash("md5");
// ok: poc.typescript.weak-hash
crypto.createHash("sha256");
// ruleid: poc.typescript.disabled-tls
const unsafe = { rejectUnauthorized: false };
// ok: poc.typescript.disabled-tls
const safe = { rejectUnauthorized: true };
