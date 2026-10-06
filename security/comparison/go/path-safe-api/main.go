package main

import (
	"os"
	"slices"
)

func main() {
	value := os.Getenv("INPUT")
	if slices.Contains([]string{"a.txt", "b.txt"}, value) {
		_, _ = os.ReadFile(value)
	}
}
