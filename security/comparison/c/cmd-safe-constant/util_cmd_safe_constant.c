#include "util_cmd_safe_constant.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

void run_cmd_safe_constant(const char *value) { (void)system(value); }
