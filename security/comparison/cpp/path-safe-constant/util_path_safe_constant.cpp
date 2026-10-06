#include "util_path_safe_constant.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

void run_path_safe_constant(const char *value) {
  FILE *file = std::fopen(value, "r");
  if (file != nullptr) {
    (void)std::fclose(file);
  }
}
