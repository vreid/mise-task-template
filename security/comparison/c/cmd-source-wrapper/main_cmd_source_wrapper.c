#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static const char *read_cmd_source_wrapper(void) {
  const char *value = getenv("INPUT");
  return value == NULL ? "" : value;
}

int main(void) {
  (void)system(read_cmd_source_wrapper());
  return 0;
}
