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

    public static void Apply(string autoexecPath)
    {
        var existing = File.Exists(autoexecPath)
            ? File.ReadAllText(autoexecPath)
            : string.Empty;
        var preserved = ManagedBlock.Replace(existing, string.Empty).TrimEnd();
        var managed = string.Join(
            Environment.NewLine,
            StartMarker,
            "cc_lang \"brazilian\"",
            "closecaption \"1\"",
            "cc_subtitles \"1\"",
            EndMarker);
        var updated = string.IsNullOrWhiteSpace(preserved)
            ? $"{managed}{Environment.NewLine}"
            : $"{preserved}{Environment.NewLine}{Environment.NewLine}" +
              $"{managed}{Environment.NewLine}";
        Directory.CreateDirectory(Path.GetDirectoryName(autoexecPath)!);
        File.WriteAllText(autoexecPath, updated, new UTF8Encoding(false));
    }
}
