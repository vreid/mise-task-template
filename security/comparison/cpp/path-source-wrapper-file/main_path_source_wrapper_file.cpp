#include "util_path_source_wrapper_file.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

int main() {
  FILE *file = std::fopen(read_path_source_wrapper_file(), "r");
  if (file != nullptr) {
    (void)std::fclose(file);
  }
  return 0;
}
