import os
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
