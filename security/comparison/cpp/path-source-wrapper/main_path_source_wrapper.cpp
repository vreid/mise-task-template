#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

static const char *read_path_source_wrapper() {
  const char *value = std::getenv("INPUT");
  return value == nullptr ? "" : value;
}

int main() {
  FILE *file = std::fopen(read_path_source_wrapper(), "r");
  if (file != nullptr) {
    (void)std::fclose(file);
  }
  return 0;
}
