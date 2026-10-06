package main

import (
	"os"
	"os/exec"
)

func read() string {
	return os.Getenv("INPUT")
}

func main() {
	_ = exec.Command("sh", "-c", read()).Run()
}
