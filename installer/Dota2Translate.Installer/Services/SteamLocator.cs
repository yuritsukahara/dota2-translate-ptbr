using Microsoft.Win32;
using System.IO;
using System.Text.RegularExpressions;

namespace Dota2TranslatePTBR.Services;

public sealed class SteamLocator
{
    public string? FindDotaRoot()
    {
        foreach (var library in FindLibraries())
        {
            var candidate = Path.Combine(library, "steamapps", "common", "dota 2 beta");
            if (IsDotaRoot(candidate)) return candidate;
        }
        return null;
    }

    public static bool IsDotaRoot(string path) =>
        File.Exists(Path.Combine(path, "game", "dota", "gameinfo.gi")) &&
        File.Exists(Path.Combine(path, "game", "dota", "pak01_dir.vpk"));

    private static IEnumerable<string> FindLibraries()
    {
        var roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        using var key = Registry.CurrentUser.OpenSubKey(@"Software\Valve\Steam");
        var steamPath = key?.GetValue("SteamPath") as string;
        if (!string.IsNullOrWhiteSpace(steamPath)) roots.Add(steamPath.Replace('/', Path.DirectorySeparatorChar));
        roots.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Steam"));

        foreach (var root in roots.ToArray())
        {
            var vdf = Path.Combine(root, "steamapps", "libraryfolders.vdf");
            if (!File.Exists(vdf)) continue;
            foreach (Match match in Regex.Matches(File.ReadAllText(vdf), "\"path\"\\s+\"([^\"]+)\""))
                roots.Add(match.Groups[1].Value.Replace(@"\\", @"\"));
        }
        return roots;
    }
}
