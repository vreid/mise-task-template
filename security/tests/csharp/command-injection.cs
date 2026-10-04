// Opengrep fixtures: parsed as source, never executed.
using System;
using System.Diagnostics;

internal static class CommandInjectionFixtures
{
    internal static void Vulnerable()
    {
        string input = Environment.GetEnvironmentVariable("DEMO_INPUT") ?? "";
        string arguments = "-c \"printf '%s\\n' " + input + "\"";
        // ruleid: poc.csharp.environment-to-shell
        Process.Start("/bin/sh", arguments);
    }

    internal static void SafeArguments()
    {
        string input = Environment.GetEnvironmentVariable("DEMO_INPUT") ?? "";
        var start = new ProcessStartInfo("/usr/bin/printf")
        {
            UseShellExecute = false,
            ArgumentList = { "%s\n", input },
        };
        // ok: poc.csharp.environment-to-shell
        Process.Start(start);
    }

    internal static void ConstantCommand()
    {
        // ok: poc.csharp.environment-to-shell
        Process.Start("/bin/sh", "-c \"printf '%s\\n' fixed\"");
    }
}
