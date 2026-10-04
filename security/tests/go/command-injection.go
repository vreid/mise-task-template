// Opengrep fixtures: parsed as source, never executed.
package fixtures

import (
	"os"
	"os/exec"
)

func vulnerable() error {
	input := os.Getenv("DEMO_INPUT")
	command := "printf '%s\\n' " + input
	// ruleid: poc.go.environment-to-shell
	return exec.Command("/bin/sh", "-c", command).Run()
}

func safeArguments() error {
	input := os.Getenv("DEMO_INPUT")
	// ok: poc.go.environment-to-shell
	return exec.Command("/usr/bin/printf", "%s\n", input).Run()
}

func constantCommand() error {
	// ok: poc.go.environment-to-shell
	return exec.Command("/bin/sh", "-c", "printf '%s\\n' fixed").Run()
}
