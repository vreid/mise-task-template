package main

import (
	"os"
	"os/exec"
)

func main() {
	value := os.Getenv("INPUT")
	_ = exec.Command("/usr/bin/printf", "%s\n", value).Run()
}
