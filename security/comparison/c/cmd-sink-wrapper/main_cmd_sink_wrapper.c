#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static void run_cmd_sink_wrapper(const char *value) { (void)system(value); }

int main(void) {
  const char *value = getenv("INPUT");
  if (value == NULL) {
    return 1;
  }
  run_cmd_sink_wrapper(value);
  return 0;
}
