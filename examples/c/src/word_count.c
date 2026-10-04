#include "word_count.h"

#include <stdbool.h>
#include <string.h>

size_t count_words(const char *text) {
    size_t count = 0;
    bool in_word = false;
    for (; *text != '\0'; ++text) {
        if (strchr(" \t\n\r\v\f", *text) != NULL) {
            in_word = false;
        } else if (!in_word) {
            ++count;
            in_word = true;
        }
    }
    return count;
}
