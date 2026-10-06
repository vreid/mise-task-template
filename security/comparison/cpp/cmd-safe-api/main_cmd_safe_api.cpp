#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

int main() {
  const char *value = std::getenv("INPUT");
  if (value == nullptr) {
    return 1;
  }
  (void)execl("/usr/bin/printf", "printf", "%s\n", value, (char *)nullptr);
  return 0;
}
