#include "util_cmd_source_wrapper_file.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

int main() {
  (void)std::system(read_cmd_source_wrapper_file());
  return 0;
}
