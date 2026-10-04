#include "word_count.hpp"

#include <iostream>

int main(int argc, char *argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: word-count TEXT\n";
        return 2;
    }
    std::cout << count_words(argv[1]) << '\n';
}
