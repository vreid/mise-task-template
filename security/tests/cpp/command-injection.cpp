// Opengrep fixtures: parsed as source, never executed.
#include <cstdlib>
#include <unistd.h>

void vulnerable() {
  const char *command = std::getenv("DEMO_INPUT");
  if (command != nullptr) {
    // ruleid: poc.cpp.environment-to-shell
    std::system(command);
  }
}

void safe_arguments() {
  char *input = std::getenv("DEMO_INPUT");
  if (input != nullptr) {
    char executable[] = "printf";
    char format[] = "%s\n";
    char *arguments[] = {executable, format, input, nullptr};
    // ok: poc.cpp.environment-to-shell
    execv("/usr/bin/printf", arguments);
  }
}

void constant_command() {
  // ok: poc.cpp.environment-to-shell
  std::system("printf '%s\\n' fixed");
}
