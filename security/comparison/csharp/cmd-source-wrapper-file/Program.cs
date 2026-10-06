using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.CmdSourceWrapperFile;

internal static class Program
{
    private static void Main()
    {
        Process.Start("/bin/sh", "-c " + Input.Read());
    }
}
