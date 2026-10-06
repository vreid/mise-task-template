using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.CmdSafeConstant;

internal static class Wrapper
{
    internal static void Run(string value)
    {
        Process.Start("/bin/sh", "-c " + value);
    }
}
