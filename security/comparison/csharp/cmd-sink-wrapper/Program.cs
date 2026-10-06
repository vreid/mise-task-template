using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.CmdSinkWrapper;

internal static class Program
{
    private static void Run(string value)
    {
        Process.Start("/bin/sh", "-c " + value);
    }

    private static void Main()
    {
        Run(Environment.GetEnvironmentVariable("INPUT") ?? "");
    }
}
