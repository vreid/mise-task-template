// Package utilpathsafeconstant wraps a sensitive call.
package utilpathsafeconstant

import "os"

// RunPathSafeConstant passes value to a sensitive call.
func RunPathSafeConstant(value string) {
	_, _ = os.ReadFile(value)
}
