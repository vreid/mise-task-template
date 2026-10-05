using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text.Json;

namespace Fixtures;

/// <summary>CWE-502: deserializing untrusted data.</summary>
internal static class Deserialization
{
    internal static object Unsafe(Stream stream)
    {
        var formatter = new BinaryFormatter();
        // expect: CA2300, CA2301
        return formatter.Deserialize(stream);
    }

    internal static string? Safe(Stream stream)
    {
        // ok: CA2300, CA2301
        return JsonSerializer.Deserialize<string>(stream);
    }
}
