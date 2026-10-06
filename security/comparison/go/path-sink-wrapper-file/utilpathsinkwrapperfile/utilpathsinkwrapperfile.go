// Package utilpathsinkwrapperfile wraps a sensitive call.
package utilpathsinkwrapperfile

import "os"

// RunPathSinkWrapperFile passes value to a sensitive call.
func RunPathSinkWrapperFile(value string) {
	_, _ = os.ReadFile(value)
}
