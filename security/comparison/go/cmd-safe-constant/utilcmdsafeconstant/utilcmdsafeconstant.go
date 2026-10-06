// Package utilcmdsafeconstant wraps a sensitive call.
package utilcmdsafeconstant

import "os/exec"

// RunCmdSafeConstant passes value to a sensitive call.
func RunCmdSafeConstant(value string) {
	_ = exec.Command("sh", "-c", value).Run()
}
