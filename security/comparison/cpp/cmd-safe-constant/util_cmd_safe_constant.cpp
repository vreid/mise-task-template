#include "util_cmd_safe_constant.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

void run_cmd_safe_constant(const char *value) { (void)std::system(value); }
