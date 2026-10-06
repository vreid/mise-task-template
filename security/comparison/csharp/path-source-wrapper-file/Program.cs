using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathSourceWrapperFile;

internal static class Program
{
    private static void Main()
    {
        Console.WriteLine(File.ReadAllText(Input.Read()));
    }
}
