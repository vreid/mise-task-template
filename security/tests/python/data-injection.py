import os
import pathlib
import requests
import markupsafe
value = os.getenv("INPUT")
# ruleid: poc.python.input-to-sql
cursor.execute("SELECT * FROM users WHERE name = '" + value + "'")
# ok: poc.python.input-to-sql
cursor.execute("SELECT * FROM users WHERE name = ?", (value,))
# ruleid: poc.python.input-to-path
open(value)
# ok: poc.python.input-to-path
open("fixed.txt")
# ruleid: poc.python.input-to-ssrf
requests.get(value)
# ok: poc.python.input-to-ssrf
requests.get("https://example.invalid/status", timeout=5)
# ruleid: poc.python.input-to-html
markupsafe.Markup(value)
# ok: poc.python.input-to-html
markupsafe.escape(value)
# ruleid: poc.python.input-to-sql
cursor.executescript("DELETE FROM t WHERE x = " + value)
# ruleid: poc.python.input-to-sql
cursor.execute(f"SELECT * FROM users WHERE name = '{value}'")
# ruleid: poc.python.input-to-path
pathlib.Path("/srv/data", value).read_text()
# ok: poc.python.input-to-path
pathlib.Path("/srv/data", "fixed.txt").read_text()
# ruleid: poc.python.input-to-ssrf
requests.post(value, timeout=5)
# ruleid: poc.python.input-to-ssrf
requests.request("GET", value, timeout=5)
# ok: poc.python.input-to-ssrf
requests.post("https://example.invalid/status", data=value, timeout=5)
