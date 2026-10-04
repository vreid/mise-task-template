using WordCount;

(string Text, int Expected)[] cases =
[
    ("", 0),
    (" \t\n\r\v\f", 0),
    ("hello", 1),
    ("  hello\tworld\nagain  ", 3),
    ("one\rtwo\vthree\ffour", 4),
    ("hello,world", 1),
    ("hello\u00a0world", 1),
];

foreach (var (text, expected) in cases)
{
    int actual = WordCounter.Count(text);
    if (actual != expected)
    {
        Console.Error.WriteLine($"Expected {expected}, got {actual}");
        return 1;
    }
}

Console.WriteLine($"C#: {cases.Length} cases passed");
return 0;
