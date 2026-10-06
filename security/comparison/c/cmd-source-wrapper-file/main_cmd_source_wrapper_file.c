#include "util_cmd_source_wrapper_file.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

int main(void) {
  (void)system(read_cmd_source_wrapper_file());
  return 0;
}
