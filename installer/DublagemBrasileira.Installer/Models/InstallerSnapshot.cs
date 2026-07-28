namespace DublagemBrasileira.Installer.Models;

public sealed record InstallerSnapshot(
    bool DotaRunning,
    bool AudioBackupPresent,
    bool CaptionsManifestPresent,
    bool GameDirectoryPresent,
    bool AudioLayerDetected,
    bool CaptionsLayerDetected,
    bool BrazilianLanguageActive)
{
    public bool HasRestorableBackup => AudioBackupPresent || CaptionsManifestPresent;

    public bool IsInstalled =>
        AudioLayerDetected ||
        CaptionsLayerDetected ||
        (HasRestorableBackup && BrazilianLanguageActive);
}
