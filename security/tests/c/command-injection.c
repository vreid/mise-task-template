// Opengrep fixtures: parsed as source, never executed.
#include <stdlib.h>
#include <unistd.h>

void vulnerable(void) {
  const char *command = getenv("DEMO_INPUT");
  if (command != NULL) {
    // ruleid: poc.c.input-to-shell
    system(command);
  }
}

void safe_arguments(void) {
  char *input = getenv("DEMO_INPUT");
  if (input != NULL) {
    char *arguments[] = {"printf", "%s\n", input, NULL};
    // ok: poc.c.input-to-shell
    execv("/usr/bin/printf", arguments);
  }
}

void constant_command(void) {
  // ok: poc.c.input-to-shell
  system("printf '%s\\n' fixed");
}

void via_shell_exec(void) {
  const char *command = getenv("DEMO_INPUT");
  if (command != NULL) {
    // ruleid: poc.c.input-to-shell
    execl("/bin/sh", "sh", "-c", command, (char *)NULL);
  }
}

int via_arguments(int argc, char *argv[]) {
  if (argc > 1) {
    // ruleid: poc.c.input-to-shell
    return system(argv[1]);
  }
  return 0;
}
