using System.Text;
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

    private static readonly Regex BaseModRegex = new(
        @"^(?<indent>[\t ]*)Mod[\t ]+dota[\t ]*(?:\r?\n|$)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Multiline);

    private static readonly Regex BrazilianModRegex = new(
        @"^[\t ]*Mod[\t ]+dota_brazilian[\t ]*\r?$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.Multiline);

    public static void Apply(string gameInfoPath)
    {
        if (!File.Exists(gameInfoPath))
        {
            throw new FileNotFoundException(
                "O gameinfo.gi principal do Dota não foi encontrado.",
                gameInfoPath);
        }

        var original = File.ReadAllText(gameInfoPath);
        var withoutManagedBlock = ManagedBlockRegex.Replace(original, string.Empty);
        if (BrazilianModRegex.IsMatch(withoutManagedBlock))
        {
            return;
        }

        var baseMod = BaseModRegex.Match(withoutManagedBlock);
        if (!baseMod.Success)
        {
            throw new InvalidDataException(
                "O caminho MOD principal não foi encontrado no gameinfo.gi.");
        }

        var newline = withoutManagedBlock.Contains("\r\n", StringComparison.Ordinal)
            ? "\r\n"
            : "\n";
        var indent = baseMod.Groups["indent"].Value;
        var managedBlock =
            $"{indent}{MarkerStart}{newline}" +
            $"{indent}Mod{new string('\t', 5)}dota_brazilian{newline}" +
            $"{indent}{MarkerEnd}{newline}";
        var updated = withoutManagedBlock.Insert(baseMod.Index, managedBlock);
        File.WriteAllText(gameInfoPath, updated, new UTF8Encoding(false));

        if (!IsActive(gameInfoPath))
        {
            throw new InvalidDataException(
                "A camada brasileira não foi montada no caminho MOD.");
        }
    }

    public static bool IsActive(string gameInfoPath)
    {
        try
        {
            var contents = File.ReadAllText(gameInfoPath);
            var brazilian = BrazilianModRegex.Match(contents);
            var baseMod = BaseModRegex.Match(contents);
            return brazilian.Success &&
                   baseMod.Success &&
                   brazilian.Index < baseMod.Index;
        }
        catch
        {
            return false;
        }
    }
}
