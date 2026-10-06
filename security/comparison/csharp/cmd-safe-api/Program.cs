using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.CmdSafeApi;

internal static class Program
{
    private static void Main()
    {
        var value = Environment.GetEnvironmentVariable("INPUT") ?? "";
        var info = new ProcessStartInfo("/usr/bin/printf");
        info.ArgumentList.Add("%s\n");
        info.ArgumentList.Add(value);
        Process.Start(info);
    }
}
