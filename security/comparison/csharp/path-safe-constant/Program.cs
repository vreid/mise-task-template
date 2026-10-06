using System;
using System.Diagnostics;
using System.IO;

namespace Comparison.PathSafeConstant;

internal static class Program
{
    private static void Main()
    {
        Wrapper.Run("fixed.txt");
    }
}
