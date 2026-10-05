package fixtures
import ("fmt"; "os"; "net/http"; "html/template")
func dangerous() {
 input := os.Getenv("INPUT")
 // ruleid: poc.go.input-to-ssrf
 http.Post(input, "text/plain", nil)
 // ruleid: poc.go.input-to-ssrf
 http.Head(input)
 // ok: poc.go.input-to-ssrf
 http.Post("https://example.invalid/status", "text/plain", nil)
 // ruleid: poc.go.input-to-sql
 db.Exec(fmt.Sprintf("DELETE FROM t WHERE x = '%s'", input))
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
