package main

import "os"

func run(value string) {
	_, _ = os.ReadFile(value)
}

func main() {
	run(os.Getenv("INPUT"))
}
