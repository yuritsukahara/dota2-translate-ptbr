using DublagemBrasileira.Installer.Services;
using DublagemBrasileira.Installer.Models;
using System.IO;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
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
    var autoexecPath = Path.Combine(
        dotaRoot,
        "game",
        "dota",
        "cfg",
        "autoexec.cfg");
    File.WriteAllText(autoexecPath, "echo \"configuração preservada\"\n");
    CaptionConfiguration.Apply(autoexecPath);
    CaptionConfiguration.Apply(autoexecPath);
    var autoexec = File.ReadAllText(autoexecPath);
    Expect(
        autoexec.Contains("echo \"configuração preservada\""),
        "Deve preservar o autoexec existente.");
    Expect(
        autoexec.Contains("cc_lang \"brazilian\"") &&
        autoexec.Contains("closecaption \"1\"") &&
        autoexec.Contains("cc_subtitles \"1\""),
        "Deve ativar captions brasileiras no autoexec.");
    Expect(
        autoexec.Split(
            "Dublagem Brasileira Dota 2: início das captions",
            StringSplitOptions.None).Length == 2,
        "A configuração gerenciada deve ser idempotente.");

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
    Expect(installed.BrazilianLanguageActive, "Deve detectar o idioma brasileiro ativo.");
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
        $"idioma ativo={layer.BrazilianLanguageActive}");
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

    var manifestEntry = archive.GetEntry("payload-manifest.json");
    Expect(manifestEntry is not null, "O pacote deve conter o manifesto interno.");
    if (manifestEntry is not null)
    {
        await using var manifestStream = manifestEntry.Open();
        var payloadManifest = await JsonSerializer.DeserializeAsync<PayloadManifest>(
            manifestStream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        Expect(payloadManifest?.Version == "6869.3", "A versão interna deve ser 6869.3.");
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
