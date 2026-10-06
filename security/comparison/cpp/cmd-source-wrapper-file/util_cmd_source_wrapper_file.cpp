#include "util_cmd_source_wrapper_file.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

const char *read_cmd_source_wrapper_file() {
  const char *value = std::getenv("INPUT");
  return value == nullptr ? "" : value;
}
