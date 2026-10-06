using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathSinkWrapper;

internal static class Program
{
    private static void Run(string value)
    {
        Console.WriteLine(File.ReadAllText(value));
    }

    private static void Main()
    {
        Run(Environment.GetEnvironmentVariable("INPUT") ?? "");
    }
}
