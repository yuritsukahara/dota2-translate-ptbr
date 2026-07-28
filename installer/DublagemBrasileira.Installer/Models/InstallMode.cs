namespace DublagemBrasileira.Installer.Models;

public enum InstallMode
{
    CaptionsOnly,
    CaptionsAndAxe
}

public static class InstallModeExtensions
{
    public static string PayloadDirectory(this InstallMode mode) => mode switch
    {
        InstallMode.CaptionsOnly => "captions",
        InstallMode.CaptionsAndAxe => "captions-axe",
        _ => throw new ArgumentOutOfRangeException(nameof(mode))
    };

    public static string MarkerValue(this InstallMode mode) => mode switch
    {
        InstallMode.CaptionsOnly => "captions",
        InstallMode.CaptionsAndAxe => "captions-axe",
        _ => throw new ArgumentOutOfRangeException(nameof(mode))
    };
}
