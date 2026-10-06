#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

static void run_cmd_sink_wrapper(const char *value) {
  (void)std::system(value);
}

int main() {
  const char *value = std::getenv("INPUT");
  if (value == nullptr) {
    return 1;
  }
  run_cmd_sink_wrapper(value);
  return 0;
}
