// Opengrep fixtures: parsed as source, never executed.
#include <cstdlib>
#include <unistd.h>

void vulnerable() {
  const char *command = std::getenv("DEMO_INPUT");
  if (command != nullptr) {
    // ruleid: poc.cpp.input-to-shell
    std::system(command);
  }
}

void safe_arguments() {
  char *input = std::getenv("DEMO_INPUT");
  if (input != nullptr) {
    char executable[] = "printf";
    char format[] = "%s\n";
    char *arguments[] = {executable, format, input, nullptr};
    // ok: poc.cpp.input-to-shell
    execv("/usr/bin/printf", arguments);
  }
}

void constant_command() {
  // ok: poc.cpp.input-to-shell
  std::system("printf '%s\\n' fixed");
}

void via_shell_exec() {
  const char *command = std::getenv("DEMO_INPUT");
  if (command != nullptr) {
    // ruleid: poc.cpp.input-to-shell
    execl("/bin/sh", "sh", "-c", command, (char *)nullptr);
  }
}

int via_arguments(int argc, char *argv[]) {
  if (argc > 1) {
    // ruleid: poc.cpp.input-to-shell
    return std::system(argv[1]);
  }
  return 0;
}
