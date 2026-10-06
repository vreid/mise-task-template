using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.CmdSafeConstant;

internal static class Program
{
    private static void Main()
    {
        Wrapper.Run("ls");
    }
}
