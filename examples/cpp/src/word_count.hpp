#ifndef WORD_COUNT_HPP
#define WORD_COUNT_HPP

#include <cstddef>
#include <string_view>

// Count words separated by ASCII whitespace.
[[nodiscard]] std::size_t count_words(std::string_view text);

#endif
