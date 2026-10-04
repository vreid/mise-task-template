#include "../src/word_count.hpp"

#include <array>
#include <cstddef>
#include <iostream>
#include <string_view>
#include <utility>

int main() {
  constexpr std::array<std::pair<std::string_view, std::size_t>, 7> cases{{
      {"", 0},
      {" \t\n\r\v\f", 0},
      {"hello", 1},
      {"  hello\tworld\nagain  ", 3},
      {"one\rtwo\vthree\ffour", 4},
      {"hello,world", 1},
      {"hello\xc2\xa0world", 1},
  }};
  for (const auto &[text, expected] : cases) {
    const auto actual = count_words(text);
    if (actual != expected) {
      std::cerr << "Expected " << expected << ", got " << actual << '\n';
      return 1;
    }
  }
  std::cout << "C++: " << cases.size() << " cases passed\n";
  return std::cout ? 0 : 1;
}
