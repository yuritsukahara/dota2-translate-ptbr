using System.Text.RegularExpressions;

namespace DublagemBrasileira.Installer.Services;

public sealed record InstalledLayerStatus(
    bool AudioDetected,
    bool CaptionsDetected,
    bool BrazilianLanguageActive);

public static class InstalledLayerDetector
{
    private static readonly Regex BrazilianUiRegex = new(
        "\"UILanguage\"\\s+\"brazilian\"",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex BrazilianAudioRegex = new(
        "\"AudioLanguage\"\\s+\"brazilian\"",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static InstalledLayerStatus Inspect(string dotaRoot)
    {
        var languageRoot = Path.Combine(dotaRoot, "game", "dota_brazilian");
        var axeAudioRoot = Path.Combine(languageRoot, "sounds", "vo", "axe");
        var subtitlesRoot = Path.Combine(languageRoot, "resource", "subtitles");
        var packedDirectory = Path.Combine(languageRoot, "pak01_dir.vpk");
        var packedArchive = Path.Combine(languageRoot, "pak01_000.vpk");
        var gameInfo = Path.Combine(languageRoot, "gameinfo.gi");
        var installerMarker = Path.Combine(languageRoot, ".dublagem-brasileira.json");
        var bootConfig = Path.Combine(dotaRoot, "game", "dota", "cfg", "boot.vcfg");

        var axeAudioCount = CountFilesSafely(axeAudioRoot, "*.vsnd_c");
        var hasProjectGameInfo = FileContains(gameInfo, "Game dota_brazilian") &&
                                 FileContains(gameInfo, "LayeredOnMod dota");
        var hasPackedLayer = File.Exists(packedDirectory) && File.Exists(packedArchive);
        var hasInstallerMarker = File.Exists(installerMarker);
        var audioDetected =
            hasInstallerMarker && hasPackedLayer ||
            axeAudioCount >= 200 && hasProjectGameInfo && hasPackedLayer;

        var captionFileCount = CountFilesSafely(subtitlesRoot, "*_brazilian.txt");
        var captionsDetected =
            hasInstallerMarker && hasPackedLayer ||
            captionFileCount > 0 && hasPackedLayer;

        var boot = ReadTextSafely(bootConfig);
        var languageActive = boot is not null &&
                             BrazilianUiRegex.IsMatch(boot) &&
                             BrazilianAudioRegex.IsMatch(boot);

        return new InstalledLayerStatus(audioDetected, captionsDetected, languageActive);
    }

    private static int CountFilesSafely(string directory, string pattern)
    {
        try
        {
            return Directory.Exists(directory)
                ? Directory.EnumerateFiles(directory, pattern, SearchOption.TopDirectoryOnly).Count()
                : 0;
        }
        catch
        {
            return 0;
        }
    }

    private static bool FileContains(string path, string value)
    {
        var content = ReadTextSafely(path);
        return content?.Contains(value, StringComparison.OrdinalIgnoreCase) == true;
    }

    private static string? ReadTextSafely(string path)
    {
        try
        {
            return File.Exists(path) ? File.ReadAllText(path) : null;
        }
        catch
        {
            return null;
        }
    }
}
