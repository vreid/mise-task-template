using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Text.Json;
using System.Security.Cryptography;

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

    internal static byte[] WeakHash(byte[] input)
    {
        // expect: CA5351
        return MD5.HashData(input);
    }

    internal static byte[] StrongHash(byte[] input)
    {
        // ok: CA5351
        return SHA256.HashData(input);
    }
}
