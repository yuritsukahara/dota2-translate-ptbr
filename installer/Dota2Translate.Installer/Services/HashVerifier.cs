using System.Security.Cryptography;
using System.IO;

namespace Dota2TranslatePTBR.Services;

public static class HashVerifier
{
    public static async Task<string> Sha256Async(string path)
    {
        await using var stream = File.OpenRead(path);
        return Convert.ToHexString(await SHA256.HashDataAsync(stream)).ToLowerInvariant();
    }

    public static async Task RequireHashAsync(string path, string expected)
    {
        var actual = await Sha256Async(path);
        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(actual), Convert.FromHexString(expected)))
            throw new InvalidDataException("O hash do pacote não corresponde ao manifesto assinado.");
    }
}
