#include "util_path_safe_constant.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void run_path_safe_constant(const char *value) {
  FILE *file = fopen(value, "r");
  if (file != NULL) {
    (void)fclose(file);
  }
}
