#include "util_path_source_wrapper_file.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

const char *read_path_source_wrapper_file(void) {
  const char *value = getenv("INPUT");
  return value == NULL ? "" : value;
}
