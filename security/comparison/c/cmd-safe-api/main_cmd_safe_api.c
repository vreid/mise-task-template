#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  const char *value = getenv("INPUT");
  if (value == NULL) {
    return 1;
  }
  (void)execl("/usr/bin/printf", "printf", "%s\n", value, (char *)NULL);
  return 0;
}
