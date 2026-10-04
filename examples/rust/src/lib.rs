/// Count words separated by ASCII whitespace, including vertical tabs.
pub fn count_words(text: &str) -> usize {
    let mut count = 0;
    let mut in_word = false;
    for character in text.bytes() {
        if b" \t\n\r\x0b\x0c".contains(&character) {
            in_word = false;
        } else if !in_word {
            count += 1;
            in_word = true;
        }
    }
    count
}

#[cfg(test)]
mod tests {
    use super::count_words;

    #[test]
    fn counts_ascii_whitespace_delimited_words() {
        let cases = [
            ("", 0),
            (" \t\n\r\x0b\x0c", 0),
            ("hello", 1),
            ("  hello\tworld\nagain  ", 3),
            ("one\rtwo\x0bthree\x0cfour", 4),
            ("hello,world", 1),
            ("hello\u{00a0}world", 1),
        ];
        for (text, expected) in cases {
            assert_eq!(count_words(text), expected, "input: {text:?}");
        }
    }
}
