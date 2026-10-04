package wordcount_test

import (
	"fmt"
	"testing"

	wordcount "example.com/word-count"
)

func TestCount(t *testing.T) {
	cases := []struct {
		text     string
		expected int
	}{
		{"", 0},
		{" \t\n\r\v\f", 0},
		{"hello", 1},
		{"  hello\tworld\nagain  ", 3},
		{"one\rtwo\vthree\ffour", 4},
		{"hello,world", 1},
		{"hello\u00a0world", 1},
	}
	for _, item := range cases {
		t.Run(fmt.Sprintf("%q", item.text), func(t *testing.T) {
			if actual := wordcount.Count(item.text); actual != item.expected {
				t.Errorf("Count(%q) = %d, want %d", item.text, actual, item.expected)
			}
		})
	}
}
