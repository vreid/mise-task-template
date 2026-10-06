package main

import (
	"example.com/comparison/path-source-wrapper-file/utilpathsourcewrapperfile"
	"os"
)

func main() {
	_, _ = os.ReadFile(utilpathsourcewrapperfile.ReadPathSourceWrapperFile())
}
