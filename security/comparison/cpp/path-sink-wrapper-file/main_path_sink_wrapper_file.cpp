#include "util_path_sink_wrapper_file.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

int main() {
  const char *value = std::getenv("INPUT");
  if (value == nullptr) {
    return 1;
  }
  run_path_sink_wrapper_file(value);
  return 0;
}
