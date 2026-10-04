namespace WordCount;

internal static class WordCounter
{
    public static int Count(string text)
    {
        ArgumentNullException.ThrowIfNull(text);
        int count = 0;
        bool inWord = false;
        foreach (char character in text)
        {
            if (" \t\n\r\v\f".Contains(character, StringComparison.Ordinal))
            {
                inWord = false;
            }
            else if (!inWord)
            {
                count++;
                inWord = true;
            }
        }
        return count;
    }
}
