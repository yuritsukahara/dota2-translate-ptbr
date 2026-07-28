using System.Text.RegularExpressions;
using DublagemBrasileira.Installer.Models;
using Microsoft.Win32;

namespace DublagemBrasileira.Installer.Services;

public sealed class DotaLocator
{
    private static readonly Regex LibraryPathRegex = new(
        "\"path\"\\s+\"(?<path>(?:\\\\.|[^\"])*)\"",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex BuildIdRegex = new(
        "\"buildid\"\\s+\"(?<build>\\d+)\"",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public IReadOnlyList<DotaInstallation> FindInstallations()
    {
        var steamRoots = GetSteamRoots().ToArray();
        var libraries = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var steamRoot in steamRoots)
        {
            AddExistingDirectory(libraries, steamRoot);
            var libraryFile = Path.Combine(steamRoot, "steamapps", "libraryfolders.vdf");
            if (!File.Exists(libraryFile))
            {
                continue;
            }

            try
            {
                foreach (var library in ParseLibraryFolders(File.ReadAllText(libraryFile)))
                {
                    AddExistingDirectory(libraries, library);
                }
            }
            catch (IOException)
            {
                // Outra instância da Steam pode estar atualizando o arquivo. A raiz
                // principal ainda permanece como candidata e a busca pode ser refeita.
            }
            catch (UnauthorizedAccessException)
            {
                // Mantém a descoberta resiliente e permite seleção manual.
            }
        }

        var results = new List<DotaInstallation>();
        foreach (var library in libraries)
        {
            var dotaRoot = Path.Combine(library, "steamapps", "common", "dota 2 beta");
            if (!TryValidate(dotaRoot, out var normalizedRoot))
            {
                continue;
            }

            var manifest = Path.Combine(library, "steamapps", "appmanifest_570.acf");
            results.Add(new DotaInstallation(
                normalizedRoot,
                library,
                File.Exists(manifest),
                TryReadBuildId(manifest)));
        }

        return results
            .OrderByDescending(result => result.HasAppManifest)
            .ThenBy(result => result.DotaRoot, StringComparer.CurrentCultureIgnoreCase)
            .ToArray();
    }

    public bool TryValidate(string? selectedPath, out string dotaRoot)
    {
        dotaRoot = string.Empty;
        if (string.IsNullOrWhiteSpace(selectedPath))
        {
            return false;
        }

        string normalized;
        try
        {
            normalized = Path.GetFullPath(selectedPath.Trim().Trim('"'))
                .TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        }
        catch (Exception exception) when (
            exception is ArgumentException or NotSupportedException or PathTooLongException)
        {
            return false;
        }

        // Aceita tanto a raiz "dota 2 beta" quanto game\dota selecionado pelo usuário.
        var suffix = Path.Combine("game", "dota");
        if (normalized.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
        {
            normalized = Directory.GetParent(Directory.GetParent(normalized)!.FullName)!.FullName;
        }

        var requiredPak = Path.Combine(normalized, "game", "dota", "pak01_dir.vpk");
        var requiredBoot = Path.Combine(normalized, "game", "dota", "cfg", "boot.vcfg");
        if (!File.Exists(requiredPak) || !File.Exists(requiredBoot))
        {
            return false;
        }

        dotaRoot = normalized;
        return true;
    }

    public static IReadOnlyList<string> ParseLibraryFolders(string vdf)
    {
        if (string.IsNullOrWhiteSpace(vdf))
        {
            return Array.Empty<string>();
        }

        return LibraryPathRegex.Matches(vdf)
            .Select(match => UnescapeVdf(match.Groups["path"].Value))
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static IEnumerable<string> GetSteamRoots()
    {
        var candidates = new[]
        {
            ReadRegistryValue(Registry.CurrentUser, @"Software\Valve\Steam", "SteamPath"),
            ReadRegistryValue(Registry.CurrentUser, @"Software\Valve\Steam", "SteamExe"),
            ReadRegistryValue(Registry.LocalMachine, @"SOFTWARE\WOW6432Node\Valve\Steam", "InstallPath"),
            ReadRegistryValue(Registry.LocalMachine, @"SOFTWARE\Valve\Steam", "InstallPath")
        };

        foreach (var value in candidates.Where(value => !string.IsNullOrWhiteSpace(value)))
        {
            var candidate = value!;
            if (candidate.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
            {
                candidate = Path.GetDirectoryName(candidate) ?? candidate;
            }

            string normalized;
            try
            {
                normalized = Path.GetFullPath(candidate.Replace('/', Path.DirectorySeparatorChar));
            }
            catch
            {
                continue;
            }

            if (Directory.Exists(normalized))
            {
                yield return normalized;
            }
        }
    }

    private static string? ReadRegistryValue(RegistryKey hive, string keyPath, string valueName)
    {
        try
        {
            using var key = hive.OpenSubKey(keyPath);
            return key?.GetValue(valueName) as string;
        }
        catch (Exception exception) when (
            exception is UnauthorizedAccessException or IOException or System.Security.SecurityException)
        {
            return null;
        }
    }

    private static void AddExistingDirectory(HashSet<string> directories, string path)
    {
        try
        {
            var normalized = Path.GetFullPath(path.Replace('/', Path.DirectorySeparatorChar));
            if (Directory.Exists(normalized))
            {
                directories.Add(normalized);
            }
        }
        catch
        {
            // Caminhos inválidos no VDF não impedem o restante da descoberta.
        }
    }

    private static string UnescapeVdf(string value) =>
        value.Replace("\\\\", "\\").Replace("\\\"", "\"");

    private static string? TryReadBuildId(string manifest)
    {
        if (!File.Exists(manifest))
        {
            return null;
        }

        try
        {
            var match = BuildIdRegex.Match(File.ReadAllText(manifest));
            return match.Success ? match.Groups["build"].Value : null;
        }
        catch
        {
            return null;
        }
    }
}
