// Package utilcmdsinkwrapperfile wraps a sensitive call.
package utilcmdsinkwrapperfile

import "os/exec"

// RunCmdSinkWrapperFile passes value to a sensitive call.
func RunCmdSinkWrapperFile(value string) {
	_ = exec.Command("sh", "-c", value).Run()
}
