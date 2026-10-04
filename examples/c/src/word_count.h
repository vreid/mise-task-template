#ifndef WORD_COUNT_H
#define WORD_COUNT_H

#include <stddef.h>

/* Count words separated by ASCII whitespace in a non-null C string. */
size_t count_words(const char *text);

#endif
