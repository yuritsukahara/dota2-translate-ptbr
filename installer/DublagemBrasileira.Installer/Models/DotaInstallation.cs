namespace DublagemBrasileira.Installer.Models;

public sealed record DotaInstallation(
    string DotaRoot,
    string SteamLibrary,
    bool HasAppManifest,
    string? BuildId)
{
    public string PakPath => Path.Combine(DotaRoot, "game", "dota", "pak01_dir.vpk");
    public string BootConfigPath => Path.Combine(DotaRoot, "game", "dota", "cfg", "boot.vcfg");
    public string ExecutablePath => Path.Combine(DotaRoot, "game", "bin", "win64", "dota2.exe");
}
