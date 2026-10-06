#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

int main() {
  const char *value = std::getenv("INPUT");
  if (value == nullptr) {
    return 1;
  }
  if (std::strcmp(value, "a.txt") == 0 || std::strcmp(value, "b.txt") == 0) {
    FILE *file = std::fopen(value, "r");
    if (file != nullptr) {
      (void)std::fclose(file);
    }
  }
  return 0;
}
