# Copyright 2026 mise-task-template contributors.
r"""Count words separated by ASCII whitespace.

>>> count_words("")
0
>>> count_words(" \t\n\r\v\f")
0
>>> count_words("hello")
1
>>> count_words("  hello\tworld\nagain  ")
3
>>> count_words("one\rtwo\vthree\ffour")
4
>>> count_words("hello,world")
1
>>> count_words("hello\u00a0world")
1
"""

import sys


def count_words(text: str) -> int:
    """Count nonempty runs delimited by ASCII whitespace.

    Args:
        text: Text to count; non-ASCII whitespace is part of a word.

    Returns:
        The number of words in text.
    """
    count = 0
    in_word = False
    for character in text:
        if character in " \t\n\r\v\f":
            in_word = False
        elif not in_word:
            count += 1
            in_word = True
    return count


def main() -> int:
    """Print the word count, or return usage error code 2 for invalid arguments."""
    arguments = sys.argv[1:]
    if len(arguments) != 1:
        sys.stderr.write("Usage: word-count TEXT\n")
        return 2
    sys.stdout.write(f"{count_words(arguments[0])}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
