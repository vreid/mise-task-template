using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.CmdSourceWrapper;

internal static class Program
{
    private static string Read()
    {
        return Environment.GetEnvironmentVariable("INPUT") ?? "";
    }

    private static void Main()
    {
        Process.Start("/bin/sh", "-c " + Read());
    }
}
