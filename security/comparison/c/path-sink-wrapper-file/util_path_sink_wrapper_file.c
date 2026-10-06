#include "util_path_sink_wrapper_file.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void run_path_sink_wrapper_file(const char *value) {
  FILE *file = fopen(value, "r");
  if (file != NULL) {
    (void)fclose(file);
  }
}
