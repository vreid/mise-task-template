import { countWords } from "./word-count.ts";

const text = process.argv[2];
if (process.argv.length !== 3 || text === undefined) {
  console.error("Usage: word-count TEXT");
  process.exitCode = 2;
} else {
  console.log(countWords(text));
}
