fn dangerous() {
 let input = std::env::var("INPUT").unwrap();
 // ruleid: poc.rust.input-to-sql
 sqlx::query(&input);
 // ok: poc.rust.input-to-sql
 sqlx::query("SELECT * FROM users WHERE name = $1").bind(&input);
 // ruleid: poc.rust.input-to-path
 std::fs::read_to_string(&input);
 // ok: poc.rust.input-to-path
 std::fs::read_to_string("fixed.txt");
 // ruleid: poc.rust.input-to-ssrf
 reqwest::get(&input);
 // ok: poc.rust.input-to-ssrf
 reqwest::get("https://example.invalid/status");
 // ruleid: poc.rust.input-to-html
 maud::PreEscaped(input.clone());
 // ok: poc.rust.input-to-html
 maud::html! { (input) };
}
