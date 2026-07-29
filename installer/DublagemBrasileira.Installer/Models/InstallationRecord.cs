namespace DublagemBrasileira.Installer.Models;

public sealed class InstallationRecord
{
    public string DotaRoot { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public string BackupDirectory { get; set; } = string.Empty;
    public bool OriginalLanguageLayerExisted { get; set; }
    public bool CaptionConfigBackupCaptured { get; set; }
    public bool OriginalAutoexecExisted { get; set; }
    public DateTimeOffset InstalledAt { get; set; }
}
