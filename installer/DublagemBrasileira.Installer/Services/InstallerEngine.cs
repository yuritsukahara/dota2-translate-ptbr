using System.Diagnostics;
using System.Text;
using System.Text.Json;
using DublagemBrasileira.Installer.Models;

namespace DublagemBrasileira.Installer.Services;

public sealed class InstallerEngine
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    private readonly Action<string> _log;
    private readonly Action<double?> _progress;
    private readonly PayloadPackageService _packages;
    private readonly string _stateRoot;
    private readonly string _statePath;

    public InstallerEngine(Action<string> log, Action<double?> progress)
    {
        _log = log;
        _progress = progress;
        _packages = new PayloadPackageService(log, progress);
        _stateRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "DublagemBrasileiraDota2");
        _statePath = Path.Combine(_stateRoot, "installation-state.json");
    }

    public InstallerSnapshot Inspect(string dotaRoot)
    {
        var installedLayer = InstalledLayerDetector.Inspect(dotaRoot);
        var record = LoadState();
        var stateMatches = record is not null &&
                           string.Equals(
                               Path.GetFullPath(record.DotaRoot),
                               Path.GetFullPath(dotaRoot),
                               StringComparison.OrdinalIgnoreCase) &&
                           Directory.Exists(record.BackupDirectory);
        return new InstallerSnapshot(
            Process.GetProcessesByName("dota2").Length > 0,
            stateMatches,
            stateMatches,
            Directory.Exists(Path.Combine(dotaRoot, "game")),
            installedLayer.AudioDetected,
            installedLayer.CaptionsDetected,
            installedLayer.BrazilianLanguageActive);
    }

    public Task<ReleaseManifest> GetReleaseManifestAsync(CancellationToken cancellationToken) =>
        _packages.GetManifestAsync(cancellationToken);

    public async Task InstallOrUpdateAsync(
        string dotaRoot,
        InstallMode mode,
        CancellationToken cancellationToken)
    {
        EnsureDotaClosed();
        ValidateDotaRoot(dotaRoot);
        _progress(null);

        var manifest = await _packages.GetManifestAsync(cancellationToken);
        var layersRoot = await _packages.PrepareAsync(manifest, cancellationToken);
        var payloadLanguageRoot = Path.Combine(
            layersRoot,
            mode.PayloadDirectory(),
            "dota_brazilian");
        var currentState = LoadState();
        var usableState = currentState is not null &&
                          string.Equals(
                              Path.GetFullPath(currentState.DotaRoot),
                              Path.GetFullPath(dotaRoot),
                              StringComparison.OrdinalIgnoreCase) &&
                          Directory.Exists(currentState.BackupDirectory);
        InstallationRecord state;

        if (usableState)
        {
            state = currentState!;
            EnsureBaseGameInfoBackup(dotaRoot, state);
            _log("Backup original preservado; aplicando a atualização sobre a versão atual…");
        }
        else
        {
            state = CreateBackup(dotaRoot, manifest.Version);
        }

        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            ApplyPayload(dotaRoot, payloadLanguageRoot, manifest, mode);
            state.Version = manifest.Version;
            state.Mode = mode.MarkerValue();
            state.InstalledAt = DateTimeOffset.UtcNow;
            SaveState(state);
            _progress(1);
            _log(
                $"Versão {manifest.Version} instalada: " +
                $"{manifest.Captions.Tokens:N0} captions" +
                (mode == InstallMode.CaptionsAndAxe
                    ? $" e {manifest.VoicePacks.Sum(pack => pack.Lines):N0} vozes do Axe."
                    : ", sem substituição de vozes."));
        }
        catch
        {
            _log("A instalação falhou. Restaurando o estado anterior…");
            RestoreFromRecord(state);
            DeleteState();
            throw;
        }
    }

    public async Task RepairAsync(
        string dotaRoot,
        InstallMode mode,
        CancellationToken cancellationToken)
    {
        EnsureDotaClosed();
        ValidateDotaRoot(dotaRoot);
        var state = LoadMatchingState(dotaRoot) ??
                    throw new InvalidOperationException(
                        "Não há um backup gerenciado para reparar esta instalação.");
        EnsureBaseGameInfoBackup(dotaRoot, state);
        var manifest = await _packages.GetManifestAsync(cancellationToken);
        var layersRoot = await _packages.PrepareAsync(manifest, cancellationToken);
        var payloadLanguageRoot = Path.Combine(
            layersRoot,
            mode.PayloadDirectory(),
            "dota_brazilian");
        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            ApplyPayload(dotaRoot, payloadLanguageRoot, manifest, mode);
            state.Version = manifest.Version;
            state.Mode = mode.MarkerValue();
            state.InstalledAt = DateTimeOffset.UtcNow;
            SaveState(state);
            _log("Arquivos verificados e instalação reparada.");
        }
        catch
        {
            _log("O reparo não pôde ser concluído. Restaurando o estado anterior…");
            RestoreFromRecord(state);
            DeleteState();
            throw;
        }
    }

    public Task RestoreAsync(string dotaRoot, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        EnsureDotaClosed();
        ValidateDotaRoot(dotaRoot);
        var state = LoadMatchingState(dotaRoot) ??
                    throw new InvalidOperationException(
                        "Nenhum backup criado por este instalador foi encontrado.");
        RestoreFromRecord(state);
        DeleteState();
        _progress(1);
        _log("Estado anterior restaurado.");
        return Task.CompletedTask;
    }

    private InstallationRecord CreateBackup(string dotaRoot, string version)
    {
        var identifier = $"{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Guid.NewGuid():N}";
        var backupRoot = Path.Combine(_stateRoot, "backups", identifier);
        var gameRoot = Path.Combine(dotaRoot, "game");
        var languageRoot = Path.Combine(gameRoot, "dota_brazilian");
        var baseGameInfoPath = Path.Combine(gameRoot, "dota", "gameinfo.gi");
        Directory.CreateDirectory(backupRoot);

        _log("Criando backup integral da camada anterior…");
        File.Copy(
            baseGameInfoPath,
            Path.Combine(backupRoot, "gameinfo.base.gi"),
            overwrite: true);
        var languageExisted = Directory.Exists(languageRoot);
        if (languageExisted)
        {
            CopyDirectory(languageRoot, Path.Combine(backupRoot, "dota_brazilian"));
        }

        return new InstallationRecord
        {
            DotaRoot = Path.GetFullPath(dotaRoot),
            Version = version,
            BackupDirectory = backupRoot,
            OriginalLanguageLayerExisted = languageExisted,
            BaseGameInfoBackupCaptured = true,
            InstalledAt = DateTimeOffset.UtcNow
        };
    }

    private void EnsureBaseGameInfoBackup(
        string dotaRoot,
        InstallationRecord state)
    {
        var backupPath = Path.Combine(
            state.BackupDirectory,
            "gameinfo.base.gi");
        if (state.BaseGameInfoBackupCaptured && File.Exists(backupPath))
        {
            return;
        }

        var gameInfoPath = Path.Combine(
            dotaRoot,
            "game",
            "dota",
            "gameinfo.gi");
        if (!File.Exists(gameInfoPath))
        {
            throw new FileNotFoundException(
                "O gameinfo.gi principal do Dota não foi encontrado.",
                gameInfoPath);
        }
        if (!File.Exists(backupPath))
        {
            File.Copy(gameInfoPath, backupPath, overwrite: false);
        }
        state.BaseGameInfoBackupCaptured = true;
        SaveState(state);
    }

    private void ApplyPayload(
        string dotaRoot,
        string payloadLanguageRoot,
        ReleaseManifest manifest,
        InstallMode mode)
    {
        var gameRoot = Path.Combine(dotaRoot, "game");
        var target = Path.Combine(gameRoot, "dota_brazilian");
        var staging = Path.Combine(gameRoot, $".dublagem-staging-{Guid.NewGuid():N}");
        var autoexecPath = Path.Combine(gameRoot, "dota", "cfg", "autoexec.cfg");
        var baseGameInfoPath = Path.Combine(gameRoot, "dota", "gameinfo.gi");

        _log("Preparando a camada brasileira verificada…");
        CopyDirectory(payloadLanguageRoot, staging);
        File.WriteAllText(
            Path.Combine(staging, ".dublagem-brasileira.json"),
            JsonSerializer.Serialize(new
            {
                schemaVersion = 1,
                manifest.Version,
                manifest.DotaBuild,
                manifest.Captions,
                manifest.VoicePacks,
                mode = mode.MarkerValue(),
                installedAt = DateTimeOffset.UtcNow
            }, JsonOptions),
            new UTF8Encoding(false));

        if (Directory.Exists(target))
        {
            Directory.Delete(target, recursive: true);
        }
        Directory.Move(staging, target);
        CaptionConfiguration.RemoveLegacyBlock(autoexecPath);
        BrazilianCaptionMountConfiguration.Apply(baseGameInfoPath);
        _log(
            "Camada ativada no caminho MOD, sem autoexec ou opções da Steam; " +
            "o áudio e o VPK inglês permanecem intactos.");
    }

    private void RestoreFromRecord(InstallationRecord state)
    {
        var gameRoot = Path.Combine(state.DotaRoot, "game");
        var target = Path.Combine(gameRoot, "dota_brazilian");
        var autoexecPath = Path.Combine(gameRoot, "dota", "cfg", "autoexec.cfg");
        var baseGameInfoPath = Path.Combine(gameRoot, "dota", "gameinfo.gi");
        var baseGameInfoBackup = Path.Combine(
            state.BackupDirectory,
            "gameinfo.base.gi");
        var languageBackup = Path.Combine(state.BackupDirectory, "dota_brazilian");

        if (Directory.Exists(target))
        {
            Directory.Delete(target, recursive: true);
        }
        if (state.OriginalLanguageLayerExisted && Directory.Exists(languageBackup))
        {
            CopyDirectory(languageBackup, target);
        }
        CaptionConfiguration.RemoveLegacyBlock(autoexecPath);
        if (state.BaseGameInfoBackupCaptured)
        {
            if (!File.Exists(baseGameInfoBackup))
            {
                throw new InvalidDataException(
                    "O backup de gameinfo.gi não foi encontrado.");
            }
            File.Copy(baseGameInfoBackup, baseGameInfoPath, overwrite: true);
        }
    }

    private InstallationRecord? LoadMatchingState(string dotaRoot)
    {
        var state = LoadState();
        return state is not null &&
               string.Equals(
                   Path.GetFullPath(state.DotaRoot),
                   Path.GetFullPath(dotaRoot),
                   StringComparison.OrdinalIgnoreCase) &&
               Directory.Exists(state.BackupDirectory)
            ? state
            : null;
    }

    private InstallationRecord? LoadState()
    {
        try
        {
            return File.Exists(_statePath)
                ? JsonSerializer.Deserialize<InstallationRecord>(
                    File.ReadAllText(_statePath),
                    JsonOptions)
                : null;
        }
        catch
        {
            return null;
        }
    }

    private void SaveState(InstallationRecord state)
    {
        Directory.CreateDirectory(_stateRoot);
        File.WriteAllText(
            _statePath,
            JsonSerializer.Serialize(state, JsonOptions),
            new UTF8Encoding(false));
    }

    private void DeleteState()
    {
        if (File.Exists(_statePath))
        {
            File.Delete(_statePath);
        }
    }

    private static void CopyDirectory(string source, string destination)
    {
        var normalizedSource = Path.GetFullPath(source);
        var normalizedDestination = Path.GetFullPath(destination);
        if (!Directory.Exists(normalizedSource))
        {
            throw new DirectoryNotFoundException(normalizedSource);
        }
        Directory.CreateDirectory(normalizedDestination);
        foreach (var directory in Directory.EnumerateDirectories(
                     normalizedSource,
                     "*",
                     SearchOption.AllDirectories))
        {
            Directory.CreateDirectory(
                Path.Combine(normalizedDestination, Path.GetRelativePath(normalizedSource, directory)));
        }
        foreach (var file in Directory.EnumerateFiles(
                     normalizedSource,
                     "*",
                     SearchOption.AllDirectories))
        {
            var target = Path.Combine(
                normalizedDestination,
                Path.GetRelativePath(normalizedSource, file));
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, overwrite: true);
        }
    }

    private static void ValidateDotaRoot(string dotaRoot)
    {
        var pak = Path.Combine(dotaRoot, "game", "dota", "pak01_dir.vpk");
        var boot = Path.Combine(dotaRoot, "game", "dota", "cfg", "boot.vcfg");
        if (!File.Exists(pak) || !File.Exists(boot))
        {
            throw new InvalidDataException("A instalação selecionada do Dota 2 não é válida.");
        }
    }

    private static void EnsureDotaClosed()
    {
        if (Process.GetProcessesByName("dota2").Length > 0)
        {
            throw new InvalidOperationException(
                "Feche o Dota 2 antes de instalar, reparar ou restaurar.");
        }
    }
}
