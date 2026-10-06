using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.CmdDirect;

internal static class Program
{
    private static void Main()
    {
        var value = Environment.GetEnvironmentVariable("INPUT") ?? "";
        Process.Start("/bin/sh", "-c " + value);
    }
}
