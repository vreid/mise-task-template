#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  const char *value = getenv("INPUT");
  if (value == NULL) {
    return 1;
  }
  if (strcmp(value, "a.txt") == 0 || strcmp(value, "b.txt") == 0) {
    FILE *file = fopen(value, "r");
    if (file != NULL) {
      (void)fclose(file);
    }
  }
  return 0;
}
