using System;

namespace Comparison.CmdSourceWrapperFile;

internal static class Input
{
    internal static string Read()
    {
        return Environment.GetEnvironmentVariable("INPUT") ?? "";
    }
}
