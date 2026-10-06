using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathSourceWrapper;

internal static class Program
{
    private static string Read()
    {
        return Environment.GetEnvironmentVariable("INPUT") ?? "";
    }

    private static void Main()
    {
        Console.WriteLine(File.ReadAllText(Read()));
    }
}
