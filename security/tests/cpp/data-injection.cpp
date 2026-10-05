#include <stdio.h>
#include <stdlib.h>
void dangerous(void) {
  char *input = getenv("INPUT");
  // ruleid: poc.cpp.input-to-sql
  sqlite3_exec(db, input, 0, 0, 0);
  // ok: poc.cpp.input-to-sql
  sqlite3_exec(db, "SELECT 1", 0, 0, 0);
  // ruleid: poc.cpp.input-to-path
  fopen(input, "r");
  // ok: poc.cpp.input-to-path
  fopen("fixed.txt", "r");
  // ruleid: poc.cpp.input-to-ssrf
  curl_easy_setopt(handle, CURLOPT_URL, input);
  // ok: poc.cpp.input-to-ssrf
  curl_easy_setopt(handle, CURLOPT_URL, "https://example.invalid/status");
}
