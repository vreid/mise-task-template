#include "word_count.h"

#include <stdio.h>

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fputs("Usage: word-count TEXT\n", stderr);
        return 2;
    }
    printf("%zu\n", count_words(argv[1]));
    return 0;
}
