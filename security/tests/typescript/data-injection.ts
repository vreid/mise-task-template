import * as fs from "node:fs";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const input = process.env["INPUT"] ?? "";
// ruleid: poc.typescript.input-to-sql
db.query("SELECT * FROM users WHERE name = '" + input + "'");
// ok: poc.typescript.input-to-sql
db.query("SELECT * FROM users WHERE name = ?", [input]);
// ruleid: poc.typescript.input-to-path
fs.readFileSync(input);
// ok: poc.typescript.input-to-path
fs.readFileSync("fixed.txt");
// ruleid: poc.typescript.input-to-ssrf
fetch(input);
// ok: poc.typescript.input-to-ssrf
fetch("https://example.invalid/status");
// ruleid: poc.typescript.input-to-html
element.innerHTML = input;
// ok: poc.typescript.input-to-html
element.textContent = input;
// ruleid: poc.typescript.input-to-path
readFileSync(join("/srv/data", input), "utf8");
// ruleid: poc.typescript.input-to-path
writeFileSync(input, "data");
// ok: poc.typescript.input-to-path
readFileSync(join("/srv/data", "fixed.txt"), "utf8");
// ruleid: poc.typescript.input-to-html
element.insertAdjacentHTML("beforeend", input);
// ok: poc.typescript.input-to-html
element.insertAdjacentHTML("beforeend", "<b>fixed</b>");
// ruleid: poc.typescript.input-to-sql
db.query(`SELECT * FROM users WHERE name = '${input}'`);
// ruleid: poc.typescript.input-to-ssrf
fetch(new URL(input));
