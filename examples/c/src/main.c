#include "word_count.h"

#include <stdio.h>

int main(int argc, char *argv[]) {
  if (argc != 2) {
    (void)fputs("Usage: word-count TEXT\n", stderr);
    return 2;
  }
  // argc == 2 guarantees argv[1] is a valid, NUL-terminated argument.
#pragma clang unsafe_buffer_usage begin
  const size_t count = count_words(argv[1]);
#pragma clang unsafe_buffer_usage end
  return printf("%zu\n", count) < 0 ? 1 : 0;
}
