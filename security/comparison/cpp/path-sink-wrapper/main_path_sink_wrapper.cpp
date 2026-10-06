#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

static void run_path_sink_wrapper(const char *value) {
  FILE *file = std::fopen(value, "r");
  if (file != nullptr) {
    (void)std::fclose(file);
  }
}

int main() {
  const char *value = std::getenv("INPUT");
  if (value == nullptr) {
    return 1;
  }
  run_path_sink_wrapper(value);
  return 0;
}
