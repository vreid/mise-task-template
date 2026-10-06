// Package utilcmdsourcewrapperfile reads untrusted input.
package utilcmdsourcewrapperfile

import "os"

// ReadCmdSourceWrapperFile returns the INPUT environment variable.
func ReadCmdSourceWrapperFile() string {
	return os.Getenv("INPUT")
}
