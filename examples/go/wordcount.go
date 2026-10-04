// Package wordcount counts words separated by ASCII whitespace.
package wordcount

import "strings"

// Count returns the number of nonempty words separated by ASCII whitespace.
func Count(text string) int {
	count := 0
	inWord := false
	for _, character := range text {
		if strings.ContainsRune(" \t\n\r\v\f", character) {
			inWord = false
		} else if !inWord {
			count++
			inWord = true
		}
	}
	return count
}
