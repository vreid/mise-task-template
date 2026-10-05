using System;
using System.IO;
using Microsoft.AspNetCore.Html;
class Fixture {
 void Dangerous() {
  var input = Environment.GetEnvironmentVariable("INPUT");
  // ruleid: poc.csharp.input-to-sql
  command.CommandText = "SELECT * FROM users WHERE name = '" + input + "'";
  // ok: poc.csharp.input-to-sql
  command.CommandText = "SELECT * FROM users WHERE name = @name";
  command.Parameters.AddWithValue("@name", input);
  // ruleid: poc.csharp.input-to-path
  File.ReadAllText(input);
  // ok: poc.csharp.input-to-path
  File.ReadAllText("fixed.txt");
  // ruleid: poc.csharp.input-to-ssrf
  client.GetAsync(input);
  // ok: poc.csharp.input-to-ssrf
  client.GetAsync("https://example.invalid/status");
  // ruleid: poc.csharp.input-to-html
  new HtmlString(input);
  // ok: poc.csharp.input-to-html
  System.Text.Encodings.Web.HtmlEncoder.Default.Encode(input);
 }
}
