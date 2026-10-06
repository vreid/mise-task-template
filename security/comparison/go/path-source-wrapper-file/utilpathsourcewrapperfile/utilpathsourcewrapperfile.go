// Package utilpathsourcewrapperfile reads untrusted input.
package utilpathsourcewrapperfile

import "os"

// ReadPathSourceWrapperFile returns the INPUT environment variable.
func ReadPathSourceWrapperFile() string {
	return os.Getenv("INPUT")
}
