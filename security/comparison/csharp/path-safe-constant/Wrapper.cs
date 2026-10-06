using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathSafeConstant;

internal static class Wrapper
{
    internal static void Run(string value)
    {
        Console.WriteLine(File.ReadAllText(value));
    }
}
