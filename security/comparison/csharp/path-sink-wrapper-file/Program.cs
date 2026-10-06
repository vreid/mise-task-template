using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathSinkWrapperFile;

internal static class Program
{
    private static void Main()
    {
        Wrapper.Run(Environment.GetEnvironmentVariable("INPUT") ?? "");
    }
}
