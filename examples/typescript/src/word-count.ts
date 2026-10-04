/** Count words separated by ASCII whitespace. */
export function countWords(text: string): number {
  let count = 0;
  let inWord = false;
  for (const character of text) {
    if (" \t\n\r\v\f".includes(character)) {
      inWord = false;
    } else if (!inWord) {
      count += 1;
      inWord = true;
    }
  }
  return count;
}
