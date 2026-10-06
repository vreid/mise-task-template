package main

import "os"

func read() string {
	return os.Getenv("INPUT")
}

func main() {
	_, _ = os.ReadFile(read())
}
