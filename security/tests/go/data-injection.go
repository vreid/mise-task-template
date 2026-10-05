package fixtures
import ("os"; "net/http"; "html/template")
func dangerous() {
 input := os.Getenv("INPUT")
 // ruleid: poc.go.input-to-sql
 db.Query("SELECT * FROM users WHERE name = '" + input + "'")
 // ok: poc.go.input-to-sql
 db.Query("SELECT * FROM users WHERE name = ?", input)
 // ruleid: poc.go.input-to-path
 os.ReadFile(input)
 // ok: poc.go.input-to-path
 os.ReadFile("fixed.txt")
 // ruleid: poc.go.input-to-ssrf
 http.Get(input)
 // ok: poc.go.input-to-ssrf
 http.Get("https://example.invalid/status")
 // ruleid: poc.go.input-to-html
 template.HTML(input)
 // ok: poc.go.input-to-html
 template.HTMLEscapeString(input)
}
