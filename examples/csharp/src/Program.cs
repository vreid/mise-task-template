using WordCount;

if (args.Length != 1)
{
    Console.Error.WriteLine("Usage: word-count TEXT");
    return 2;
}

Console.WriteLine(WordCounter.Count(args[0]));
return 0;
