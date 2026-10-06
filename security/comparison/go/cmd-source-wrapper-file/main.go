package main

import (
	"example.com/comparison/cmd-source-wrapper-file/utilcmdsourcewrapperfile"
	"os/exec"
)

func main() {
	_ = exec.Command("sh", "-c", utilcmdsourcewrapperfile.ReadCmdSourceWrapperFile()).Run()
}
