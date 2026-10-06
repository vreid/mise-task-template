package main

import (
	"os"
	"os/exec"
)

func run(value string) {
	_ = exec.Command("sh", "-c", value).Run()
}

func main() {
	run(os.Getenv("INPUT"))
}
