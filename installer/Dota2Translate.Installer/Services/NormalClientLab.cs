using Dota2TranslatePTBR.Models;
using System.IO;

namespace Dota2TranslatePTBR.Services;

/// <summary>
/// Feature gate for the unsupported normal-client experiment.
/// This class intentionally refuses unknown or unsigned compatibility data.
/// It never edits executables, VPK bases, or anti-cheat state.
/// </summary>
public sealed class NormalClientLab
{
    public bool CanEnable(string dotaRoot, LabCompatibility? compatibility)
    {
        if (compatibility is not { Enabled: true }) return false;
        var gameInfo = Path.Combine(dotaRoot, "game", "dota", "gameinfo.gi");
        if (!File.Exists(gameInfo)) return false;
        var actual = HashVerifier.Sha256Async(gameInfo).GetAwaiter().GetResult();
        return string.Equals(actual, compatibility.GameInfoSha256, StringComparison.OrdinalIgnoreCase);
    }

    public void Enable(string dotaRoot, LabCompatibility compatibility)
    {
        if (!CanEnable(dotaRoot, compatibility))
            throw new InvalidOperationException("Este build não possui compatibilidade assinada. O laboratório permanece bloqueado.");

        // A implementação de montagem só será adicionada depois de um teste
        // explícito confirmar que o search path funciona sem bypass de VAC/CRC.
        throw new NotSupportedException("Laboratório ainda não publicado para este build.");
    }
}
