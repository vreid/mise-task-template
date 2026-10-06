#include "util_path_source_wrapper_file.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  FILE *file = fopen(read_path_source_wrapper_file(), "r");
  if (file != NULL) {
    (void)fclose(file);
  }
  return 0;
}
