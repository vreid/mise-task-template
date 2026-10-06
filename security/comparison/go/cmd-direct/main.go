package main

import (
	"os"
	"os/exec"
)

func main() {
	value := os.Getenv("INPUT")
	_ = exec.Command("sh", "-c", value).Run()
}
