#include "word_count.hpp"

#include <cstddef>
#include <string_view>

std::size_t count_words(std::string_view text) {
  constexpr std::string_view whitespace = " \t\n\r\v\f";
  std::size_t count = 0;
  bool in_word = false;
  for (const char character : text) {
    if (whitespace.find(character) != std::string_view::npos) {
      in_word = false;
    } else if (!in_word) {
      ++count;
      in_word = true;
    }
  }
  return count;
}
