#include "util_cmd_sink_wrapper_file.hpp"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <unistd.h>

void run_cmd_sink_wrapper_file(const char *value) { (void)std::system(value); }
