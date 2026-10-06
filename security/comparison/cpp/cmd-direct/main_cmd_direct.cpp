#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

int main() {
  const char *value = std::getenv("INPUT");
  if (value == nullptr) {
    return 1;
  }
  (void)std::system(value);
  return 0;
}
