package main

import (
	"fmt"
	"os"

	wordcount "example.com/word-count"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "Usage: word-count TEXT")
		os.Exit(2)
	}
	fmt.Println(wordcount.Count(os.Args[1]))
}
