package main

import (
	"example.com/comparison/path-sink-wrapper-file/utilpathsinkwrapperfile"
	"os"
)

func main() {
	utilpathsinkwrapperfile.RunPathSinkWrapperFile(os.Getenv("INPUT"))
}
