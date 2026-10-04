#include "word_count.hpp"

#include <iostream>
#include <span>

// Stream output can throw in some standard libraries, for example from locale
// facets. Treat that like any other output failure instead of escaping main.
int main(int argc, char **argv) try {
  if (argc != 2) {
    std::cerr << "Usage: word-count TEXT\n";
    return 2;
  }
  // argc == 2 guarantees both elements exist; keep raw argv at this boundary.
#pragma clang unsafe_buffer_usage begin
  const std::span arguments(argv, 2);
#pragma clang unsafe_buffer_usage end
  std::cout << count_words(arguments.back()) << '\n';
  return std::cout ? 0 : 1;
} catch (...) {
  return 1;
}
