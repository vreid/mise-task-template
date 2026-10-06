#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

int main() {
  const char *value = std::getenv("INPUT");
  if (value == nullptr) {
    return 1;
  }
  FILE *file = std::fopen(value, "r");
  if (file != nullptr) {
    (void)std::fclose(file);
  }
  return 0;
}
