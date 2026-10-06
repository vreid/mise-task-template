#include "util_path_sink_wrapper_file.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  const char *value = getenv("INPUT");
  if (value == NULL) {
    return 1;
  }
  run_path_sink_wrapper_file(value);
  return 0;
}
