using System.Diagnostics;
using System.IO;
using System.IO.Compression;

namespace Dota2TranslatePTBR.Services;

public sealed class InstallerService
{
    private const string AddonName = "dota2_translate_ptbr";
    private static string StateRoot => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Dota2TranslatePTBR");

    public async Task InstallAddonAsync(string dotaRoot, string packagePath, IProgress<string> progress)
    {
        EnsureSafeToModify(dotaRoot);
        progress.Report("Verificando pacote…");
        var work = Path.Combine(StateRoot, "staging", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(work);
        try
        {
            ZipFile.ExtractToDirectory(packagePath, work);
            var packageRoot = Directory.GetDirectories(work).SingleOrDefault() ?? work;
            var sourceContent = Path.Combine(packageRoot, "build", "content", AddonName);
            var sourceGame = Path.Combine(packageRoot, "addon", "game");
            if (!Directory.Exists(sourceContent) || !Directory.Exists(sourceGame))
                throw new InvalidDataException("O ZIP não possui a estrutura esperada do projeto.");

            var contentTarget = Path.Combine(dotaRoot, "content", "dota_addons", AddonName);
            var gameTarget = Path.Combine(dotaRoot, "game", "dota_addons", AddonName);
            BackupExisting(contentTarget, "content");
            BackupExisting(gameTarget, "game");

            progress.Report("Copiando arquivos do addon…");
            CopyTree(sourceContent, contentTarget);
            CopyTree(sourceGame, gameTarget);
            var template = Path.Combine(dotaRoot, "content", "dota_addons", "addon_template", "maps", "template_map.vmap");
            if (!File.Exists(template)) throw new FileNotFoundException("Instale o DLC Dota 2 Workshop Tools.", template);
            Directory.CreateDirectory(Path.Combine(contentTarget, "maps"));
            File.Copy(template, Path.Combine(contentTarget, "maps", "template_map.vmap"), true);

            progress.Report("Compilando recursos com os Workshop Tools…");
            var compiler = Path.Combine(dotaRoot, "game", "bin", "win64", "resourcecompiler.exe");
            if (!File.Exists(compiler)) throw new FileNotFoundException("Resource Compiler não encontrado.", compiler);
            var process = Process.Start(new ProcessStartInfo
            {
                FileName = compiler,
                Arguments = $"-i \"{Path.Combine(contentTarget, "*")}\" -r -nop4 -f",
                UseShellExecute = false,
                CreateNoWindow = true,
            }) ?? throw new InvalidOperationException("Não foi possível iniciar o Resource Compiler.");
            await process.WaitForExitAsync();
            if (process.ExitCode != 0) throw new InvalidOperationException($"A compilação falhou (código {process.ExitCode}).");
        }
        catch
        {
            await RestoreAsync(dotaRoot, progress);
            throw;
        }
        finally
        {
            if (Directory.Exists(work)) Directory.Delete(work, true);
        }
    }

    public Task RestoreAsync(string dotaRoot, IProgress<string> progress)
    {
        EnsureGameClosed();
        progress.Report("Restaurando estado anterior…");
        RestoreTarget(Path.Combine(dotaRoot, "content", "dota_addons", AddonName), "content");
        RestoreTarget(Path.Combine(dotaRoot, "game", "dota_addons", AddonName), "game");
        return Task.CompletedTask;
    }

    private static void EnsureSafeToModify(string dotaRoot)
    {
        if (!SteamLocator.IsDotaRoot(dotaRoot)) throw new DirectoryNotFoundException("A pasta escolhida não é uma instalação válida do Dota 2.");
        EnsureGameClosed();
    }

    private static void EnsureGameClosed()
    {
        if (Process.GetProcessesByName("dota2").Length > 0)
            throw new InvalidOperationException("Feche o Dota 2 antes de instalar ou restaurar.");
    }

    private static void BackupExisting(string target, string slot)
    {
        var backup = Path.Combine(StateRoot, "backup", slot);
        if (Directory.Exists(backup)) Directory.Delete(backup, true);
        if (!Directory.Exists(target)) return;
        Directory.CreateDirectory(Path.GetDirectoryName(backup)!);
        Directory.Move(target, backup);
    }

    private static void RestoreTarget(string target, string slot)
    {
        var backup = Path.Combine(StateRoot, "backup", slot);
        if (Directory.Exists(target)) Directory.Delete(target, true);
        if (Directory.Exists(backup))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            Directory.Move(backup, target);
        }
    }

    private static void CopyTree(string source, string destination)
    {
        Directory.CreateDirectory(destination);
        foreach (var directory in Directory.GetDirectories(source, "*", SearchOption.AllDirectories))
            Directory.CreateDirectory(directory.Replace(source, destination));
        foreach (var file in Directory.GetFiles(source, "*", SearchOption.AllDirectories))
        {
            var target = file.Replace(source, destination);
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, true);
        }
    }
}
