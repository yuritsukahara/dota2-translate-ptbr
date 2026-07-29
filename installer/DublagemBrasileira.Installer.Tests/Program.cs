using DublagemBrasileira.Installer.Services;
using DublagemBrasileira.Installer.Models;
using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Windows.Controls;
using System.Windows.Media.Imaging;

var failures = new List<string>();
var locator = new DotaLocator();

var tangoLogoLoaded = false;
Exception? tangoLogoError = null;
var logoThread = new Thread(() =>
{
    try
    {
        var app = new DublagemBrasileira.Installer.App();
        app.InitializeComponent();
        var window = new DublagemBrasileira.Installer.MainWindow();
        var logo = window.FindName("TangoLeagueLogo") as Image;
        tangoLogoLoaded =
            logo?.Source is BitmapSource source &&
            source.PixelWidth > 0 &&
            source.PixelHeight > 0;
        window.Close();
        app.Shutdown();
    }
    catch (Exception error)
    {
        tangoLogoError = error;
    }
});
logoThread.SetApartmentState(ApartmentState.STA);
logoThread.Start();
logoThread.Join();
Expect(
    tangoLogoLoaded,
    tangoLogoError is null
        ? "A logo da Tango League deve carregar do recurso incorporado."
        : $"A logo da Tango League deve carregar: {tangoLogoError.Message}");

var parsed = DotaLocator.ParseLibraryFolders(
    """
    "libraryfolders"
    {
        "0"
        {
            "path"  "C:\\Program Files (x86)\\Steam"
        }
        "1"
        {
            "path"  "D:\\SteamLibrary"
        }
    }
    """);

Expect(parsed.Count == 2, "Deve ler todas as bibliotecas do libraryfolders.vdf.");
Expect(
    parsed.Contains(@"D:\SteamLibrary", StringComparer.OrdinalIgnoreCase),
    "Deve desfazer o escape das barras do VDF.");

var testRoot = Path.Combine(
    Path.GetTempPath(),
    $"dublagem-installer-test-{Guid.NewGuid():N}");
var dotaRoot = Path.Combine(testRoot, "steamapps", "common", "dota 2 beta");
try
{
    Directory.CreateDirectory(Path.Combine(dotaRoot, "game", "dota", "cfg"));
    File.WriteAllBytes(Path.Combine(dotaRoot, "game", "dota", "pak01_dir.vpk"), [0x56, 0x50, 0x4B]);
    File.WriteAllText(
        Path.Combine(dotaRoot, "game", "dota", "cfg", "boot.vcfg"),
        "\"UILanguage\" \"english\"");
    var baseGameInfoPath = Path.Combine(
        dotaRoot,
        "game",
        "dota",
        "gameinfo.gi");
    var originalGameInfo =
        "\"GameInfo\"\r\n{\r\n\t\"FileSystem\"\r\n\t{\r\n" +
        "\t\t\"SearchPaths\"\r\n\t\t{\r\n" +
        "\t\t\tGame\t\t\t\tdota\r\n" +
        "\t\t\tMod\t\t\t\t\tdota\r\n" +
        "\t\t}\r\n\t}\r\n}\r\n";
    var legacyGameInfo = originalGameInfo.Replace(
        "\t\t\tMod\t\t\t\t\tdota\r\n",
        "\t\t\t// Dublagem Brasileira Dota 2: início da montagem de captions\r\n" +
        "\t\t\tMod\t\t\t\t\tdota_brazilian\r\n" +
        "\t\t\t// Dublagem Brasileira Dota 2: fim da montagem de captions\r\n" +
        "\t\t\tMod\t\t\t\t\tdota\r\n");
    File.WriteAllText(baseGameInfoPath, legacyGameInfo);
    Expect(
        BrazilianCaptionMountConfiguration.IsLegacyMountPresent(baseGameInfoPath),
        "Deve detectar a montagem legada no gameinfo.gi base.");
    Expect(
        BrazilianCaptionMountConfiguration.RemoveLegacyMount(baseGameInfoPath),
        "Deve remover a montagem legada durante a migração.");
    Expect(
        File.ReadAllText(baseGameInfoPath) == originalGameInfo,
        "A limpeza deve restaurar o conteúdo original sem a camada brasileira.");
    Expect(
        !BrazilianCaptionMountConfiguration.RemoveLegacyMount(baseGameInfoPath),
        "A limpeza da montagem legada deve ser idempotente.");
    var autoexecPath = Path.Combine(
        dotaRoot,
        "game",
        "dota",
        "cfg",
        "autoexec.cfg");
    File.WriteAllText(
        autoexecPath,
        "echo \"configuração preservada\"\n" +
        "// Dublagem Brasileira Dota 2: início das captions\n" +
        "cc_lang \"brazilian\"\n" +
        "closecaption \"1\"\n" +
        "cc_subtitles \"1\"\n" +
        "// Dublagem Brasileira Dota 2: fim das captions\n");
    CaptionConfiguration.RemoveLegacyBlock(autoexecPath);
    CaptionConfiguration.RemoveLegacyBlock(autoexecPath);
    var autoexec = File.ReadAllText(autoexecPath);
    Expect(
        autoexec.Contains("echo \"configuração preservada\""),
        "Deve preservar o autoexec existente.");
    Expect(
        !autoexec.Contains("Dublagem Brasileira Dota 2: início das captions") &&
        !autoexec.Contains("cc_lang \"brazilian\""),
        "Deve remover a configuração legada de captions do autoexec.");
    File.WriteAllText(
        autoexecPath,
        "// Dublagem Brasileira Dota 2: início das captions\n" +
        "cc_lang \"brazilian\"\n" +
        "// Dublagem Brasileira Dota 2: fim das captions\n");
    CaptionConfiguration.RemoveLegacyBlock(autoexecPath);
    Expect(
        !File.Exists(autoexecPath),
        "Deve apagar o autoexec quando ele continha somente o bloco legado.");

    Expect(
        locator.TryValidate(dotaRoot, out var validated) &&
        string.Equals(validated, dotaRoot, StringComparison.OrdinalIgnoreCase),
        "Deve validar a raiz dota 2 beta.");
    Expect(
        locator.TryValidate(Path.Combine(dotaRoot, "game", "dota"), out validated) &&
        string.Equals(validated, dotaRoot, StringComparison.OrdinalIgnoreCase),
        "Deve aceitar game\\dota e normalizar para a raiz.");

    File.Delete(Path.Combine(dotaRoot, "game", "dota", "pak01_dir.vpk"));
    Expect(
        !locator.TryValidate(dotaRoot, out _),
        "Deve recusar instalação sem pak01_dir.vpk.");

    var languageRoot = Path.Combine(dotaRoot, "game", "dota_brazilian");
    var axeAudioRoot = Path.Combine(languageRoot, "sounds", "vo", "axe");
    var subtitlesRoot = Path.Combine(languageRoot, "resource", "subtitles");
    Directory.CreateDirectory(axeAudioRoot);
    Directory.CreateDirectory(subtitlesRoot);
    for (var index = 0; index < 200; index++)
    {
        File.WriteAllBytes(Path.Combine(axeAudioRoot, $"axe_test_{index:000}.vsnd_c"), [0x01]);
    }
    File.WriteAllText(
        Path.Combine(languageRoot, "gameinfo.gi"),
        "LayeredOnMod dota\nGame dota_brazilian");
    File.WriteAllText(
        Path.Combine(languageRoot, ".dublagem-brasileira.json"),
        "{\"schemaVersion\":1}");
    File.WriteAllBytes(Path.Combine(languageRoot, "pak01_dir.vpk"), [0x56, 0x50, 0x4B]);
    File.WriteAllBytes(Path.Combine(languageRoot, "pak01_000.vpk"), [0x01]);
    File.WriteAllText(
        Path.Combine(subtitlesRoot, "subtitles_axe_brazilian.txt"),
        "\"axe_test\" \"Teste\"");
    File.WriteAllText(
        Path.Combine(dotaRoot, "game", "dota", "cfg", "boot.vcfg"),
        "\"UILanguage\" \"brazilian\"\n\"AudioLanguage\" \"brazilian\"");

    var installed = InstalledLayerDetector.Inspect(dotaRoot);
    Expect(installed.AudioDetected, "Deve detectar o pack de voz já instalado.");
    Expect(installed.CaptionsDetected, "Deve detectar as captions já instaladas.");
    Expect(
        installed.LayerReady,
        "A camada completa deve ficar pronta para o fluxo nativo de idioma.");
    Expect(
        !BrazilianCaptionMountConfiguration.IsLegacyMountPresent(baseGameInfoPath),
        "A instalação nova não deve exigir montagem no gameinfo.gi base.");
}
finally
{
    var normalizedTemp = Path.GetFullPath(testRoot);
    var systemTemp = Path.GetFullPath(Path.GetTempPath());
    if (normalizedTemp.StartsWith(systemTemp, StringComparison.OrdinalIgnoreCase) &&
        Directory.Exists(normalizedTemp))
    {
        Directory.Delete(normalizedTemp, recursive: true);
    }
}

var detected = locator.FindInstallations();
Console.WriteLine($"Instalações reais encontradas: {detected.Count}");
foreach (var installation in detected)
{
    var layer = InstalledLayerDetector.Inspect(installation.DotaRoot);
    Console.WriteLine(
        $"- {installation.DotaRoot} | build {installation.BuildId ?? "não informado"}");
    Console.WriteLine(
        $"  Dublagem: áudio={layer.AudioDetected}, captions={layer.CaptionsDetected}, " +
        $"camada pronta={layer.LayerReady}");
}

var repositoryRoot = FindRepositoryRoot();
var releaseArchive = Path.Combine(
    repositoryRoot,
    "build",
    "windows-installer-release",
    "dublagem-ptbr-payload.zip");
var skipPayload = args.Contains("--skip-payload", StringComparer.OrdinalIgnoreCase);
if (!skipPayload)
{
    Expect(File.Exists(releaseArchive), "O pacote de release deve ter sido gerado.");
}
if (!skipPayload && File.Exists(releaseArchive))
{
    using var archive = ZipFile.OpenRead(releaseArchive);
    var names = archive.Entries.Select(entry => entry.FullName).ToHashSet(
        StringComparer.OrdinalIgnoreCase);
    Expect(
        !names.Any(name =>
            name.StartsWith("layers/", StringComparison.OrdinalIgnoreCase) &&
            !Regex.IsMatch(
                name,
                "^layers/(captions|captions-axe)/dota_brazilian/",
                RegexOptions.IgnoreCase)),
        "O ZIP deve escrever somente na camada dota_brazilian.");
    Expect(
        names.Contains("layers/captions/dota_brazilian/pak01_dir.vpk"),
        "O pacote deve conter o modo somente captions.");
    Expect(
        names.Contains("layers/captions-axe/dota_brazilian/pak01_dir.vpk"),
        "O pacote deve conter o modo captions + Axe.");
    Expect(
        names.Contains(
            "layers/captions/dota_brazilian/resource/subtitles/subtitles_axe_brazilian.txt"),
        "O modo de captions deve manter o arquivo individual do Axe.");
    Expect(
        names.Contains(
            "layers/captions/dota_brazilian/resource/subtitles/subtitles_crystalmaiden_brazilian.txt"),
        "O modo de captions deve manter o arquivo individual da Crystal Maiden.");
    Expect(
        names.Contains(
            "layers/captions/dota_brazilian/resource/subtitles/subtitles_announcer_brazilian.txt"),
        "O modo de captions deve manter o narrador padrão ancorado.");
    var snapfireEntry = archive.GetEntry(
        "layers/captions/dota_brazilian/resource/subtitles/" +
        "subtitles_snapfire_brazilian.txt");
    Expect(
        snapfireEntry is not null,
        "O modo de captions deve conter o grupo da Snapfire.");
    if (snapfireEntry is not null)
    {
        using var reader = new StreamReader(snapfireEntry.Open());
        var snapfireCaptions = await reader.ReadToEndAsync();
        var snapfireRows = Regex.Matches(
                snapfireCaptions,
                "^\\s*\"([^\"]+)\"\\s+\"([^\"]*)\"\\s*$",
                RegexOptions.Multiline)
            .Cast<Match>()
            .Where(match => match.Groups[1].Value != "Language")
            .ToDictionary(
                match => match.Groups[1].Value,
                match => match.Groups[2].Value,
                StringComparer.OrdinalIgnoreCase);
        Expect(
            snapfireRows.TryGetValue(
                "snapfire_snapfire_spawn_01",
                out var snapfireCaption) &&
            snapfireRows.TryGetValue(
                "[english]snapfire_snapfire_spawn_01",
                out var snapfireEnglishCaption) &&
            string.Equals(
                snapfireCaption,
                snapfireEnglishCaption,
                StringComparison.Ordinal),
            "A Snapfire deve fornecer o mesmo texto para o token normal e o alias inglês.");
        foreach (var row in snapfireRows.Where(entry =>
                     !entry.Key.StartsWith("[english]", StringComparison.OrdinalIgnoreCase)))
        {
            Expect(
                snapfireRows.TryGetValue(
                    $"[english]{row.Key}",
                    out var aliasCaption) &&
                string.Equals(row.Value, aliasCaption, StringComparison.Ordinal),
                $"Token da Snapfire sem alias inglês equivalente: {row.Key}");
        }
    }
    foreach (var language in new[] { "english", "russian" })
    {
        var path =
            "layers/captions/dota_brazilian/resource/subtitles/" +
            $"subtitles_announcer_{language}.txt";
        Expect(
            !names.Contains(path),
            $"O pacote Brazilian não deve conter o recurso {language}.");
    }
    var announcerEntry = archive.GetEntry(
        "layers/captions/dota_brazilian/resource/subtitles/" +
        "subtitles_announcer_brazilian.txt");
    if (announcerEntry is not null)
    {
        using var reader = new StreamReader(announcerEntry.Open());
        var announcerCaptions = await reader.ReadToEndAsync();
        Expect(
            announcerCaptions.Contains(
                "\"announcer_announcer_battle_prepare_01\"" +
                "\t\"Prepare-se para a batalha.\""),
            "O token normal do narrador deve permanecer em PT-BR.");
        Expect(
            announcerCaptions.Contains(
                "\"[english]announcer_announcer_battle_prepare_01\"" +
                "\t\t\"Prepare-se para a batalha.\""),
            "O alias solicitado pelo áudio inglês deve usar a caption PT-BR.");
        var captionsByToken = Regex.Matches(
                announcerCaptions,
                "^\\s*\"([^\"]+)\"\\s+\"([^\"]*)\"\\s*$",
                RegexOptions.Multiline)
            .Cast<Match>()
            .Where(match => match.Groups[1].Value != "Language")
            .GroupBy(match => match.Groups[1].Value)
            .ToDictionary(
                group => group.Key,
                group => group.Last().Groups[2].Value,
                StringComparer.OrdinalIgnoreCase);
        var announcerAliases = captionsByToken
            .Where(entry =>
                entry.Key.StartsWith(
                    "[english]announcer_",
                    StringComparison.OrdinalIgnoreCase))
            .ToArray();
        Expect(
            announcerAliases.Length == 2_074,
            "Todas as 2.074 captions do narrador devem possuir alias inglês.");
        foreach (var alias in announcerAliases)
        {
            var normalToken = alias.Key["[english]".Length..];
            Expect(
                captionsByToken.TryGetValue(normalToken, out var normalCaption) &&
                string.Equals(normalCaption, alias.Value, StringComparison.Ordinal),
                $"O alias deve repetir a caption PT-BR: {normalToken}");
        }
    }

    var manifestEntry = archive.GetEntry("payload-manifest.json");
    Expect(manifestEntry is not null, "O pacote deve conter o manifesto interno.");
    if (manifestEntry is not null)
    {
        await using var manifestStream = manifestEntry.Open();
        var payloadManifest = await JsonSerializer.DeserializeAsync<PayloadManifest>(
            manifestStream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Expect(payloadManifest?.Version == "6869.11", "A versão interna deve ser 6869.11.");
        foreach (var file in payloadManifest?.Files ?? [])
        {
            var entry = archive.GetEntry(file.Path);
            Expect(entry is not null, $"Arquivo listado deve existir: {file.Path}");
            if (entry is null)
            {
                continue;
            }
            await using var stream = entry.Open();
            var hash = await SHA256.HashDataAsync(stream);
            Expect(
                string.Equals(
                    Convert.ToHexString(hash),
                    file.Sha256,
                    StringComparison.OrdinalIgnoreCase),
                $"Hash interno deve conferir: {file.Path}");
        }
    }
}
else if (skipPayload)
{
    Console.WriteLine("Validação do ZIP ignorada; somente fontes do instalador foram verificadas.");
}

if (failures.Count > 0)
{
    Console.Error.WriteLine("Falhas:");
    foreach (var failure in failures)
    {
        Console.Error.WriteLine($"- {failure}");
    }
    return 1;
}

Console.WriteLine("Todos os testes de descoberta passaram.");
return 0;

void Expect(bool condition, string message)
{
    if (!condition)
    {
        failures.Add(message);
    }
}

string FindRepositoryRoot()
{
    var current = new DirectoryInfo(Environment.CurrentDirectory);
    while (current is not null)
    {
        if (File.Exists(Path.Combine(current.FullName, "package.json")) &&
            Directory.Exists(Path.Combine(current.FullName, "installer")))
        {
            return current.FullName;
        }
        current = current.Parent;
    }
    throw new DirectoryNotFoundException("Raiz do repositório não encontrada.");
}
