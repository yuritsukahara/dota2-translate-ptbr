using Dota2TranslatePTBR.Models;
using Dota2TranslatePTBR.Services;
using Xunit;

namespace Dota2Translate.Tests;

public sealed class InstallerSafetyTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), $"dota2-translate-tests-{Guid.NewGuid():N}");

    [Fact]
    public void DotaRootRequiresGameInfoAndBaseVpk()
    {
        Directory.CreateDirectory(Path.Combine(_root, "game", "dota"));
        File.WriteAllText(Path.Combine(_root, "game", "dota", "gameinfo.gi"), "GameInfo {}");
        Assert.False(SteamLocator.IsDotaRoot(_root));

        File.WriteAllBytes(Path.Combine(_root, "game", "dota", "pak01_dir.vpk"), [0]);
        Assert.True(SteamLocator.IsDotaRoot(_root));
    }

    [Fact]
    public void NormalClientLabRejectsUnknownBuild()
    {
        Assert.False(new NormalClientLab().CanEnable(_root, null));
    }

    [Fact]
    public void NormalClientLabRejectsDivergentGameInfo()
    {
        Directory.CreateDirectory(Path.Combine(_root, "game", "dota"));
        File.WriteAllText(Path.Combine(_root, "game", "dota", "gameinfo.gi"), "GameInfo {}");
        var compatibility = new LabCompatibility(true, new string('0', 64), "dota2_translate_ptbr");
        Assert.False(new NormalClientLab().CanEnable(_root, compatibility));
    }

    public void Dispose()
    {
        if (Directory.Exists(_root)) Directory.Delete(_root, true);
    }
}
