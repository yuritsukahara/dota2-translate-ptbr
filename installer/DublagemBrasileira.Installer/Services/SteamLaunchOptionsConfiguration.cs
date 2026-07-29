using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Win32;

namespace DublagemBrasileira.Installer.Services;

public sealed record SteamLaunchOptionsBackup(
    string LocalConfigPath,
    bool LaunchOptionsExisted,
    string OriginalLaunchOptions);

public static class SteamLaunchOptionsConfiguration
{
    private const ulong SteamId64Base = 76561197960265728;

    private static readonly Regex LastOwnerRegex = new(
        "\"LastOwner\"\\s+\"(?<id>\\d+)\"",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex AppBlockStartRegex = new(
        "\"570\"\\s*\\{",
        RegexOptions.Compiled);

    private static readonly Regex LaunchOptionsRegex = new(
        "\"LaunchOptions\"\\s+\"(?<value>(?:\\\\.|[^\"])*)\"",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex LaunchOptionsLineRegex = new(
        "^[\\t ]*\"LaunchOptions\"\\s+\"(?:\\\\.|[^\"])*\"[\\t ]*(?:\\r?\\n)?",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Multiline);

    private static readonly Regex BrazilianLanguageRegex = new(
        "(?<!\\S)-language(?:\\s+|=)(?:\"brazilian\"|brazilian)(?=\\s|$)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex AnyLanguageRegex = new(
        "(?<!\\S)-language(?:\\s+|=)(?:\"(?:\\\\.|[^\"])*\"|\\S+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public static string LocateLocalConfig(string dotaRoot)
    {
        var manifestPath = GetManifestPath(dotaRoot);
        if (!File.Exists(manifestPath))
        {
            throw new FileNotFoundException(
                "O manifesto Steam do Dota 2 não foi encontrado.",
                manifestPath);
        }
        var lastOwner = ReadLastOwner(manifestPath);
        var steamRoots = GetSteamRoots().Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

        if (lastOwner is not null && lastOwner >= SteamId64Base)
        {
            var accountId = lastOwner.Value - SteamId64Base;
            foreach (var steamRoot in steamRoots)
            {
                var exactPath = Path.Combine(
                    steamRoot,
                    "userdata",
                    accountId.ToString(),
                    "config",
                    "localconfig.vdf");
                if (File.Exists(exactPath))
                {
                    return Path.GetFullPath(exactPath);
                }
            }
        }

        var candidates = steamRoots
            .SelectMany(EnumerateLocalConfigs)
            .Where(path => TryFindDotaBlock(File.ReadAllText(path), out _, out _))
            .OrderByDescending(File.GetLastWriteTimeUtc)
            .ToArray();
        return candidates.FirstOrDefault() ??
               throw new FileNotFoundException(
                   "A configuração do usuário Steam que possui o Dota 2 não foi encontrada.");
    }

    public static SteamLaunchOptionsBackup Capture(string localConfigPath)
    {
        var contents = File.ReadAllText(localConfigPath);
        var block = FindDotaBlock(contents);
        var body = contents.Substring(block.BodyStart, block.BodyLength);
        var match = LaunchOptionsRegex.Match(body);
        return new SteamLaunchOptionsBackup(
            Path.GetFullPath(localConfigPath),
            match.Success,
            match.Success ? Unescape(match.Groups["value"].Value) : string.Empty);
    }

    public static void Apply(string localConfigPath)
    {
        UpdateFile(
            localConfigPath,
            current => EnsureBrazilianLanguage(current));
        if (!IsActive(localConfigPath))
        {
            throw new InvalidDataException(
                "A Steam não salvou a opção -language brazilian para o Dota 2.");
        }
    }

    public static void Restore(
        string localConfigPath,
        bool launchOptionsExisted,
        string originalLaunchOptions)
    {
        if (!File.Exists(localConfigPath))
        {
            throw new FileNotFoundException(
                "A configuração Steam usada no backup não foi encontrada.",
                localConfigPath);
        }

        UpdateFile(
            localConfigPath,
            _ => launchOptionsExisted ? originalLaunchOptions : null);
    }

    public static bool IsActive(string localConfigPath)
    {
        try
        {
            var contents = File.ReadAllText(localConfigPath);
            var block = FindDotaBlock(contents);
            var body = contents.Substring(block.BodyStart, block.BodyLength);
            var match = LaunchOptionsRegex.Match(body);
            return match.Success &&
                   BrazilianLanguageRegex.IsMatch(
                       Unescape(match.Groups["value"].Value));
        }
        catch
        {
            return false;
        }
    }

    public static string EnsureBrazilianLanguage(string launchOptions)
    {
        var preserved = AnyLanguageRegex.Replace(launchOptions ?? string.Empty, " ");
        preserved = Regex.Replace(preserved, "\\s+", " ").Trim();
        return string.IsNullOrEmpty(preserved)
            ? "-language brazilian"
            : $"{preserved} -language brazilian";
    }

    private static void UpdateFile(
        string localConfigPath,
        Func<string, string?> transform)
    {
        var contents = File.ReadAllText(localConfigPath);
        var block = FindDotaBlock(contents);
        var body = contents.Substring(block.BodyStart, block.BodyLength);
        var launchOptions = LaunchOptionsRegex.Match(body);
        var current = launchOptions.Success
            ? Unescape(launchOptions.Groups["value"].Value)
            : string.Empty;
        var replacement = transform(current);
        string updated;

        if (launchOptions.Success)
        {
            var absoluteMatchStart = block.BodyStart + launchOptions.Index;
            if (replacement is null)
            {
                var line = LaunchOptionsLineRegex.Match(
                    contents,
                    absoluteMatchStart - GetLineIndent(contents, absoluteMatchStart).Length);
                updated = line.Success
                    ? contents.Remove(line.Index, line.Length)
                    : contents.Remove(absoluteMatchStart, launchOptions.Length);
            }
            else
            {
                var value = launchOptions.Groups["value"];
                var absoluteValueStart = block.BodyStart + value.Index;
                updated = contents.Remove(absoluteValueStart, value.Length)
                    .Insert(absoluteValueStart, Escape(replacement));
            }
        }
        else
        {
            if (replacement is null)
            {
                return;
            }

            var closingIndent = GetLineIndent(contents, block.ClosingBrace);
            var newline = contents.Contains("\r\n", StringComparison.Ordinal)
                ? "\r\n"
                : "\n";
            var property =
                $"{closingIndent}\t\"LaunchOptions\"\t\t\"{Escape(replacement)}\"{newline}";
            updated = contents.Insert(block.ClosingBrace - closingIndent.Length, property);
        }

        var temporaryPath = $"{localConfigPath}.{Guid.NewGuid():N}.tmp";
        File.WriteAllText(temporaryPath, updated, new UTF8Encoding(false));
        try
        {
            File.Move(temporaryPath, localConfigPath, overwrite: true);
        }
        finally
        {
            File.Delete(temporaryPath);
        }
    }

    private static DotaBlock FindDotaBlock(string contents) =>
        TryFindDotaBlock(contents, out var block, out var reason)
            ? block
            : throw new InvalidDataException(reason);

    private static bool TryFindDotaBlock(
        string contents,
        out DotaBlock block,
        out string reason)
    {
        foreach (Match match in AppBlockStartRegex.Matches(contents))
        {
            var openingBrace = contents.IndexOf('{', match.Index, match.Length);
            var closingBrace = FindMatchingBrace(contents, openingBrace);
            if (closingBrace < 0)
            {
                continue;
            }

            var bodyStart = openingBrace + 1;
            var bodyLength = closingBrace - bodyStart;
            var body = contents.Substring(bodyStart, bodyLength);
            if (LaunchOptionsRegex.IsMatch(body) ||
                Regex.IsMatch(body, "\"(?:LastPlayed|Playtime)\"", RegexOptions.IgnoreCase))
            {
                block = new DotaBlock(bodyStart, bodyLength, closingBrace);
                reason = string.Empty;
                return true;
            }
        }

        block = default;
        reason = "O bloco de configurações do Dota 2 (app 570) não foi encontrado.";
        return false;
    }

    private static int FindMatchingBrace(string contents, int openingBrace)
    {
        var depth = 0;
        var quoted = false;
        var escaped = false;
        for (var index = openingBrace; index < contents.Length; index++)
        {
            var character = contents[index];
            if (quoted)
            {
                if (escaped)
                {
                    escaped = false;
                }
                else if (character == '\\')
                {
                    escaped = true;
                }
                else if (character == '"')
                {
                    quoted = false;
                }
                continue;
            }

            if (character == '"')
            {
                quoted = true;
            }
            else if (character == '{')
            {
                depth++;
            }
            else if (character == '}' && --depth == 0)
            {
                return index;
            }
        }
        return -1;
    }

    private static string GetLineIndent(string contents, int index)
    {
        var lineStart = contents.LastIndexOf('\n', Math.Max(0, index - 1));
        lineStart = lineStart < 0 ? 0 : lineStart + 1;
        var cursor = lineStart;
        while (cursor < contents.Length &&
               (contents[cursor] == '\t' || contents[cursor] == ' '))
        {
            cursor++;
        }
        return contents.Substring(lineStart, cursor - lineStart);
    }

    private static string GetManifestPath(string dotaRoot)
    {
        var common = Directory.GetParent(Path.GetFullPath(dotaRoot)) ??
                     throw new DirectoryNotFoundException(dotaRoot);
        var steamApps = common.Parent ??
                        throw new DirectoryNotFoundException(common.FullName);
        return Path.Combine(steamApps.FullName, "appmanifest_570.acf");
    }

    private static ulong? ReadLastOwner(string manifestPath)
    {
        if (!File.Exists(manifestPath))
        {
            return null;
        }
        var match = LastOwnerRegex.Match(File.ReadAllText(manifestPath));
        return match.Success && ulong.TryParse(match.Groups["id"].Value, out var owner)
            ? owner
            : null;
    }

    private static IEnumerable<string> GetSteamRoots()
    {
        var values = new[]
        {
            ReadRegistryValue(Registry.CurrentUser, @"Software\Valve\Steam", "SteamPath"),
            ReadRegistryValue(Registry.CurrentUser, @"Software\Valve\Steam", "SteamExe"),
            ReadRegistryValue(
                Registry.LocalMachine,
                @"SOFTWARE\WOW6432Node\Valve\Steam",
                "InstallPath"),
            ReadRegistryValue(
                Registry.LocalMachine,
                @"SOFTWARE\Valve\Steam",
                "InstallPath")
        };

        foreach (var value in values.Where(value => !string.IsNullOrWhiteSpace(value)))
        {
            var candidate = value!;
            if (candidate.EndsWith(".exe", StringComparison.OrdinalIgnoreCase))
            {
                candidate = Path.GetDirectoryName(candidate) ?? candidate;
            }
            if (Directory.Exists(candidate))
            {
                yield return Path.GetFullPath(candidate);
            }
        }
    }

    private static IEnumerable<string> EnumerateLocalConfigs(string steamRoot)
    {
        var userdata = Path.Combine(steamRoot, "userdata");
        if (!Directory.Exists(userdata))
        {
            return Array.Empty<string>();
        }
        return Directory.EnumerateFiles(
            userdata,
            "localconfig.vdf",
            SearchOption.AllDirectories);
    }

    private static string? ReadRegistryValue(
        RegistryKey hive,
        string keyPath,
        string valueName)
    {
        try
        {
            using var key = hive.OpenSubKey(keyPath);
            return key?.GetValue(valueName) as string;
        }
        catch
        {
            return null;
        }
    }

    private static string Escape(string value) =>
        value.Replace("\\", "\\\\").Replace("\"", "\\\"");

    private static string Unescape(string value) =>
        value.Replace("\\\"", "\"").Replace("\\\\", "\\");

    private readonly record struct DotaBlock(
        int BodyStart,
        int BodyLength,
        int ClosingBrace);
}
