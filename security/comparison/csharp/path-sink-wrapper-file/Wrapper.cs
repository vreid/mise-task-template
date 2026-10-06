using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathSinkWrapperFile;

internal static class Wrapper
{
    internal static void Run(string value)
    {
        Console.WriteLine(File.ReadAllText(value));
    }
}
