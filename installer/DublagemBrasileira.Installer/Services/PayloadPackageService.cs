using System.IO.Compression;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text.Json;
using DublagemBrasileira.Installer.Models;

namespace DublagemBrasileira.Installer.Services;

public sealed class PayloadPackageService
{
    public const string ManifestUrl =
        "https://github.com/yuritsukahara/dota2-translate-ptbr/releases/download/" +
        "installer-channel-stable/installer-manifest.json";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient;
    private readonly Action<string> _log;
    private readonly Action<double?> _progress;
    private readonly string _cacheRoot;

    public PayloadPackageService(Action<string> log, Action<double?> progress)
    {
        _log = log;
        _progress = progress;
        _cacheRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "DublagemBrasileiraDota2",
            "cache");
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromMinutes(10)
        };
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
            "DublagemBrasileiraDota2-Installer/1.0");
    }

    public async Task<ReleaseManifest> GetManifestAsync(CancellationToken cancellationToken)
    {
        var overrideUrl = Environment.GetEnvironmentVariable("DUBLAGEM_MANIFEST_URL");
        var manifestUrl = string.IsNullOrWhiteSpace(overrideUrl) ? ManifestUrl : overrideUrl;
        _log("Consultando a versão estável no GitHub…");
        using var response = await _httpClient.GetAsync(manifestUrl, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var manifest = await JsonSerializer.DeserializeAsync<ReleaseManifest>(
            stream,
            JsonOptions,
            cancellationToken);
        ValidateManifest(manifest);
        return manifest!;
    }

    public async Task<string> PrepareAsync(
        ReleaseManifest manifest,
        CancellationToken cancellationToken)
    {
        var versionRoot = Path.Combine(_cacheRoot, SanitizeSegment(manifest.Version));
        var archivePath = Path.Combine(versionRoot, "payload.zip");
        var extractedRoot = Path.Combine(versionRoot, "payload");
        var extractionHashMarker = Path.Combine(extractedRoot, ".archive-sha256");
        Directory.CreateDirectory(versionRoot);

        if (!File.Exists(archivePath) ||
            !await HasExpectedHashAsync(archivePath, manifest.Payload.Sha256, cancellationToken))
        {
            await DownloadAsync(manifest.Payload, archivePath, cancellationToken);
        }
        else
        {
            _log("Pacote já está no cache e passou pela verificação SHA-256.");
        }

        var markerPath = Path.Combine(extractedRoot, "payload-manifest.json");
        var extractionMatchesArchive =
            File.Exists(markerPath) &&
            File.Exists(extractionHashMarker) &&
            string.Equals(
                await File.ReadAllTextAsync(extractionHashMarker, cancellationToken),
                manifest.Payload.Sha256,
                StringComparison.OrdinalIgnoreCase);
        if (!extractionMatchesArchive)
        {
            ExtractSecurely(archivePath, extractedRoot);
        }

        try
        {
            await ValidateExtractedPayloadAsync(
                extractedRoot,
                manifest.Version,
                cancellationToken);
        }
        catch
        {
            if (Directory.Exists(extractedRoot))
            {
                Directory.Delete(extractedRoot, recursive: true);
            }
            ExtractSecurely(archivePath, extractedRoot);
            await ValidateExtractedPayloadAsync(
                extractedRoot,
                manifest.Version,
                cancellationToken);
        }
        await File.WriteAllTextAsync(
            extractionHashMarker,
            manifest.Payload.Sha256,
            cancellationToken);

        var layersRoot = Path.Combine(extractedRoot, "layers");
        if (!Directory.Exists(Path.Combine(layersRoot, "captions", "dota_brazilian")) ||
            !Directory.Exists(Path.Combine(layersRoot, "captions-axe", "dota_brazilian")))
        {
            throw new InvalidDataException("O pacote não contém os dois modos de instalação.");
        }

        _progress(1);
        return layersRoot;
    }

    private async Task DownloadAsync(
        PayloadDownloadInfo payload,
        string archivePath,
        CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(payload.Url, UriKind.Absolute, out var payloadUri) ||
            payloadUri.Scheme != Uri.UriSchemeHttps)
        {
            throw new InvalidDataException("A URL do pacote não é HTTPS válida.");
        }

        var partialPath = $"{archivePath}.part";
        if (File.Exists(partialPath))
        {
            File.Delete(partialPath);
        }

        _log($"Baixando {(payload.Bytes / 1024d / 1024d):0.0} MB do GitHub…");
        _progress(0);
        using var response = await _httpClient.GetAsync(
            payloadUri,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
        response.EnsureSuccessStatusCode();

        var total = response.Content.Headers.ContentLength ?? payload.Bytes;
        await using var source = await response.Content.ReadAsStreamAsync(cancellationToken);
        await using var destination = new FileStream(
            partialPath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None,
            81920,
            useAsync: true);
        var buffer = new byte[81920];
        long downloaded = 0;
        int read;
        while ((read = await source.ReadAsync(buffer, cancellationToken)) > 0)
        {
            await destination.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            downloaded += read;
            if (total > 0)
            {
                _progress(Math.Clamp((double)downloaded / total, 0, 1));
            }
        }

        await destination.FlushAsync(cancellationToken);
        if (!await HasExpectedHashAsync(partialPath, payload.Sha256, cancellationToken))
        {
            File.Delete(partialPath);
            throw new InvalidDataException(
                "O download não passou pela verificação SHA-256. Tente novamente.");
        }

        File.Move(partialPath, archivePath, overwrite: true);
        _log("Download concluído e autenticidade do arquivo verificada.");
    }

    private static void ExtractSecurely(string archivePath, string destination)
    {
        if (Directory.Exists(destination))
        {
            Directory.Delete(destination, recursive: true);
        }
        Directory.CreateDirectory(destination);
        var normalizedDestination = Path.GetFullPath(destination)
            .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

        using var archive = ZipFile.OpenRead(archivePath);
        foreach (var entry in archive.Entries)
        {
            var target = Path.GetFullPath(Path.Combine(destination, entry.FullName));
            if (!target.StartsWith(normalizedDestination, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidDataException("O pacote contém um caminho inválido.");
            }
        }

        ZipFile.ExtractToDirectory(archivePath, destination, overwriteFiles: true);
    }

    private static async Task ValidateExtractedPayloadAsync(
        string extractedRoot,
        string expectedVersion,
        CancellationToken cancellationToken)
    {
        var manifestPath = Path.Combine(extractedRoot, "payload-manifest.json");
        if (!File.Exists(manifestPath))
        {
            throw new InvalidDataException("Manifesto interno do pacote ausente.");
        }

        var manifest = JsonSerializer.Deserialize<PayloadManifest>(
            await File.ReadAllTextAsync(manifestPath, cancellationToken),
            JsonOptions);
        if (manifest is null ||
            manifest.SchemaVersion != 1 ||
            manifest.Files.Count == 0 ||
            !string.Equals(manifest.Version, expectedVersion, StringComparison.Ordinal))
        {
            throw new InvalidDataException("Manifesto interno inválido.");
        }

        var normalizedRoot = Path.GetFullPath(extractedRoot)
            .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        foreach (var file in manifest.Files)
        {
            var path = Path.GetFullPath(Path.Combine(extractedRoot, file.Path));
            if (!path.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase) ||
                !File.Exists(path))
            {
                throw new InvalidDataException($"Arquivo do pacote ausente: {file.Path}");
            }
            var info = new FileInfo(path);
            if (info.Length != file.Bytes ||
                !await HasExpectedHashAsync(path, file.Sha256, cancellationToken))
            {
                throw new InvalidDataException($"Arquivo do pacote inválido: {file.Path}");
            }
        }
    }

    private static async Task<bool> HasExpectedHashAsync(
        string path,
        string expectedHash,
        CancellationToken cancellationToken)
    {
        await using var stream = File.OpenRead(path);
        var hash = await SHA256.HashDataAsync(stream, cancellationToken);
        return string.Equals(
            Convert.ToHexString(hash),
            expectedHash,
            StringComparison.OrdinalIgnoreCase);
    }

    private static void ValidateManifest(ReleaseManifest? manifest)
    {
        if (manifest is null ||
            manifest.SchemaVersion != 1 ||
            string.IsNullOrWhiteSpace(manifest.Version) ||
            string.IsNullOrWhiteSpace(manifest.Payload.Url) ||
            manifest.Payload.Bytes <= 0 ||
            manifest.Payload.Sha256.Length != 64)
        {
            throw new InvalidDataException("O manifesto publicado no GitHub é inválido.");
        }
    }

    private static string SanitizeSegment(string value)
    {
        var invalid = Path.GetInvalidFileNameChars();
        return new string(value.Select(character =>
            invalid.Contains(character) ? '_' : character).ToArray());
    }
}
