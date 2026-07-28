using System.Text.Json;

namespace DublagemBrasileira.Installer.Services;

public sealed class InstallerSettings
{
    private static readonly string SettingsDirectory = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "DublagemBrasileiraDota2");

    private static readonly string SettingsPath = Path.Combine(SettingsDirectory, "settings.json");

    public string? DotaRoot { get; set; }

    public static InstallerSettings Load()
    {
        try
        {
            return File.Exists(SettingsPath)
                ? JsonSerializer.Deserialize<InstallerSettings>(File.ReadAllText(SettingsPath)) ?? new()
                : new();
        }
        catch
        {
            return new();
        }
    }

    public void Save()
    {
        Directory.CreateDirectory(SettingsDirectory);
        File.WriteAllText(
            SettingsPath,
            JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true }));
    }
}
