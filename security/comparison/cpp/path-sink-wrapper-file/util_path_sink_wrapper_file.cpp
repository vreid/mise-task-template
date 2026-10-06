#include "util_path_sink_wrapper_file.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

void run_path_sink_wrapper_file(const char *value) {
  FILE *file = std::fopen(value, "r");
  if (file != nullptr) {
    (void)std::fclose(file);
  }
}
