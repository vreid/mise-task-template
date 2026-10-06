#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static const char *read_path_source_wrapper(void) {
  const char *value = getenv("INPUT");
  return value == NULL ? "" : value;
}

int main(void) {
  FILE *file = fopen(read_path_source_wrapper(), "r");
  if (file != NULL) {
    (void)fclose(file);
  }
  return 0;
}
