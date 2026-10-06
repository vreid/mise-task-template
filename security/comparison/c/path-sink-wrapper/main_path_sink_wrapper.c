#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static void run_path_sink_wrapper(const char *value) {
  FILE *file = fopen(value, "r");
  if (file != NULL) {
    (void)fclose(file);
  }
}

int main(void) {
  const char *value = getenv("INPUT");
  if (value == NULL) {
    return 1;
  }
  run_path_sink_wrapper(value);
  return 0;
}
