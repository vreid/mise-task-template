#include "util_cmd_sink_wrapper_file.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void run_cmd_sink_wrapper_file(const char *value) { (void)system(value); }
