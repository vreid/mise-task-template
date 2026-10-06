using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathSafeApi;

internal static class Program
{
    private static void Main()
    {
        var value = Environment.GetEnvironmentVariable("INPUT") ?? "";
        if (value == "a.txt" || value == "b.txt")
        {
            Console.WriteLine(File.ReadAllText(value));
        }
    }
}
