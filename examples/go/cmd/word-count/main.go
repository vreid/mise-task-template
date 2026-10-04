// Command word-count prints the number of ASCII-whitespace-delimited words.
package main

import (
	"fmt"
	"os"

	wordcount "example.com/word-count"
)

func main() {
	if len(os.Args) != 2 {
		if _, err := fmt.Fprintln(os.Stderr, "Usage: word-count TEXT"); err != nil {
			os.Exit(1)
		}
		os.Exit(2)
	}
	if _, err := fmt.Println(wordcount.Count(os.Args[1])); err != nil {
		os.Exit(1)
	}
}
