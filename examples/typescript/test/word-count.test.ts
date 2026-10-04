import { strictEqual } from "node:assert";
import { test } from "node:test";
import { countWords } from "../src/word-count.ts";

const cases: readonly (readonly [string, number])[] = [
  ["", 0],
  [" \t\n\r\v\f", 0],
  ["hello", 1],
  ["  hello\tworld\nagain  ", 3],
  ["one\rtwo\vthree\ffour", 4],
  ["hello,world", 1],
  ["hello\u00A0world", 1],
];

for (const [text, expected] of cases) {
  void test(`countWords(${JSON.stringify(text)})`, () => {
    strictEqual(countWords(text), expected);
  });
}
