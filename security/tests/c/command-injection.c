// Opengrep fixtures: parsed as source, never executed.
#include <stdlib.h>
#include <unistd.h>

void vulnerable(void) {
  const char *command = getenv("DEMO_INPUT");
  if (command != NULL) {
    // ruleid: poc.c.environment-to-shell
    system(command);
  }
}

void safe_arguments(void) {
  char *input = getenv("DEMO_INPUT");
  if (input != NULL) {
    char *arguments[] = {"printf", "%s\n", input, NULL};
    // ok: poc.c.environment-to-shell
    execv("/usr/bin/printf", arguments);
  }
}

void constant_command(void) {
  // ok: poc.c.environment-to-shell
  system("printf '%s\\n' fixed");
}
