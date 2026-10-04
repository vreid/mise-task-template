#include "../src/word_count.h"

#include <stdio.h>

int main(void) {
  const struct {
    const char *text;
    size_t expected;
  } cases[] = {
      {"", 0},
      {" \t\n\r\v\f", 0},
      {"hello", 1},
      {"  hello\tworld\nagain  ", 3},
      {"one\rtwo\vthree\ffour", 4},
      {"hello,world", 1},
      {"hello\xc2\xa0world", 1},
  };
  const size_t case_count = sizeof(cases) / sizeof(cases[0]);
  // Every index stays below the actual array extent computed above.
#pragma clang unsafe_buffer_usage begin
  for (size_t i = 0; i < case_count; ++i) {
    const size_t actual = count_words(cases[i].text);
    if (actual != cases[i].expected) {
      (void)fprintf(stderr, "Case %zu: expected %zu, got %zu\n", i,
                    cases[i].expected, actual);
      return 1;
    }
  }
#pragma clang unsafe_buffer_usage end
  return printf("C: %zu cases passed\n", case_count) < 0 ? 1 : 0;
}
