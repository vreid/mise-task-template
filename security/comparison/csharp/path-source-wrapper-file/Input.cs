using System;

namespace Comparison.PathSourceWrapperFile;

internal static class Input
{
    internal static string Read()
    {
        return Environment.GetEnvironmentVariable("INPUT") ?? "";
    }
}
