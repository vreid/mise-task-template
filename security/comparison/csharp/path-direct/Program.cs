using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathDirect;

internal static class Program
{
    private static void Main()
    {
        var value = Environment.GetEnvironmentVariable("INPUT") ?? "";
        Console.WriteLine(File.ReadAllText(value));
    }
}
