using System.Text.RegularExpressions;

namespace DublagemBrasileira.Installer.Services;

public static class BrazilianCaptionMountConfiguration
{
    private const string MarkerStart =
        "// Dublagem Brasileira Dota 2: início da montagem de captions";
    private const string MarkerEnd =
        "// Dublagem Brasileira Dota 2: fim da montagem de captions";

    private static readonly Regex ManagedBlockRegex = new(
        $@"^[\t ]*{Regex.Escape(MarkerStart)}\r?\n" +
        @"[\t ]*Mod[\t ]+dota_brazilian[\t ]*\r?\n" +
        $@"[\t ]*{Regex.Escape(MarkerEnd)}\r?\n?",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Multiline);

    private static readonly Regex BrazilianModRegex = new(
        @"^[\t ]*Mod[\t ]+dota_brazilian[\t ]*\r?$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Multiline);

    public static bool RemoveLegacyMount(string gameInfoPath)
    {
        if (!File.Exists(gameInfoPath))
        {
            return false;
        }

        var original = File.ReadAllText(gameInfoPath);
        var updated = ManagedBlockRegex.Replace(original, string.Empty);
        if (string.Equals(updated, original, StringComparison.Ordinal))
        {
            return false;
        }

        File.WriteAllText(gameInfoPath, updated);
        return true;
    }

    public static bool IsLegacyMountPresent(string gameInfoPath)
    {
        try
        {
            var contents = File.ReadAllText(gameInfoPath);
            return ManagedBlockRegex.IsMatch(contents) ||
                   BrazilianModRegex.IsMatch(contents);
        }
        catch
        {
            return false;
        }
    }
}
