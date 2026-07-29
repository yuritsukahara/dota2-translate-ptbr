using System.Diagnostics;

namespace DublagemBrasileira.Installer.Services;

public static class SteamClientCoordinator
{
    public static async Task<bool> StopIfRunningAsync(
        string localConfigPath,
        Action<string> log,
        CancellationToken cancellationToken)
    {
        if (Process.GetProcessesByName("steam").Length == 0)
        {
            return false;
        }

        var steamExecutable = GetSteamExecutable(localConfigPath);
        log("Reiniciando a Steam para salvar a camada brasileira…");
        Process.Start(new ProcessStartInfo
        {
            FileName = steamExecutable,
            Arguments = "-shutdown",
            UseShellExecute = true
        });

        var deadline = DateTime.UtcNow.AddSeconds(35);
        while (Process.GetProcessesByName("steam").Length > 0)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (DateTime.UtcNow >= deadline)
            {
                throw new InvalidOperationException(
                    "A Steam não encerrou a tempo. Feche-a por completo e tente novamente.");
            }
            await Task.Delay(350, cancellationToken);
        }
        return true;
    }

    public static void Restart(string localConfigPath, Action<string> log)
    {
        var steamExecutable = GetSteamExecutable(localConfigPath);
        Process.Start(new ProcessStartInfo
        {
            FileName = steamExecutable,
            UseShellExecute = true
        });
        log("Steam reaberta; o Dota usará a camada brasileira no próximo início.");
    }

    private static string GetSteamExecutable(string localConfigPath)
    {
        var config = Directory.GetParent(Path.GetFullPath(localConfigPath));
        var account = config?.Parent;
        var userdata = account?.Parent;
        var steamRoot = userdata?.Parent;
        var executable = steamRoot is null
            ? string.Empty
            : Path.Combine(steamRoot.FullName, "steam.exe");
        if (!File.Exists(executable))
        {
            throw new FileNotFoundException(
                "O executável principal da Steam não foi encontrado.",
                executable);
        }
        return executable;
    }
}
