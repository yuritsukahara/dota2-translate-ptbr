using System.Text;
using System.Text.RegularExpressions;

namespace DublagemBrasileira.Installer.Services;

public static class CaptionConfiguration
{
    private const string StartMarker =
        "// Dublagem Brasileira Dota 2: início das captions";
    private const string EndMarker =
        "// Dublagem Brasileira Dota 2: fim das captions";
    private static readonly Regex ManagedBlock = new(
        $@"(?:\r?\n)?{Regex.Escape(StartMarker)}.*?{Regex.Escape(EndMarker)}(?:\r?\n)?",
        RegexOptions.Singleline | RegexOptions.CultureInvariant);

    public static void RemoveLegacyBlock(string autoexecPath)
    {
        if (!File.Exists(autoexecPath))
        {
            return;
        }

        var existing = File.ReadAllText(autoexecPath);
        var preserved = ManagedBlock.Replace(existing, string.Empty).Trim();
        if (string.IsNullOrEmpty(preserved))
        {
            File.Delete(autoexecPath);
            return;
        }

        File.WriteAllText(
            autoexecPath,
            $"{preserved}{Environment.NewLine}",
            new UTF8Encoding(false));
    }
}
