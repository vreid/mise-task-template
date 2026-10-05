import * as fs from "node:fs";
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
