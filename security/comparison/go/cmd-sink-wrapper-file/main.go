package main

import (
	"example.com/comparison/cmd-sink-wrapper-file/utilcmdsinkwrapperfile"
	"os"
)

func main() {
	utilcmdsinkwrapperfile.RunCmdSinkWrapperFile(os.Getenv("INPUT"))
}
