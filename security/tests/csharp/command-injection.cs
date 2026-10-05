// Opengrep fixtures: parsed as source, never executed.
using System;
using System.Diagnostics;

internal static class CommandInjectionFixtures
{
    internal static void Vulnerable()
    {
        string input = Environment.GetEnvironmentVariable("DEMO_INPUT") ?? "";
        string arguments = "-c \"printf '%s\\n' " + input + "\"";
        // ruleid: poc.csharp.input-to-shell
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
        // ok: poc.csharp.input-to-shell
        Process.Start(start);
    }

    internal static void ConstantCommand()
    {
        // ok: poc.csharp.input-to-shell
        Process.Start("/bin/sh", "-c \"printf '%s\\n' fixed\"");
    }

    internal static void ViaBash()
    {
        string input = Environment.GetEnvironmentVariable("DEMO_INPUT") ?? "";
        // ruleid: poc.csharp.input-to-shell
        Process.Start("bash", "-c \"" + input + "\"");
    }

    internal static void ViaWindowsShell(string[] args)
    {
        // ruleid: poc.csharp.input-to-shell
        Process.Start("cmd.exe", "/c " + args[0]);
    }

    internal static void ViaStartInfo()
    {
        string input = Environment.GetEnvironmentVariable("DEMO_INPUT") ?? "";
        // ruleid: poc.csharp.input-to-shell
        Process.Start(new ProcessStartInfo("/bin/sh", "-c " + input));
    }
}
