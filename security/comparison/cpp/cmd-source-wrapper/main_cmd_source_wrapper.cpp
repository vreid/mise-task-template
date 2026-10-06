#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

static const char *read_cmd_source_wrapper() {
  const char *value = std::getenv("INPUT");
  return value == nullptr ? "" : value;
}

int main() {
  (void)std::system(read_cmd_source_wrapper());
  return 0;
}
