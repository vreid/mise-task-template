package main

import "os"

func main() {
	value := os.Getenv("INPUT")
	_, _ = os.ReadFile(value)
}
