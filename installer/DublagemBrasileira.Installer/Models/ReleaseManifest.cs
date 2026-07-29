using System.Text.Json.Serialization;

namespace DublagemBrasileira.Installer.Models;

public sealed class ReleaseManifest
{
    public int SchemaVersion { get; set; }
    public string Version { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DotaBuildInfo DotaBuild { get; set; } = new();
    public CaptionReleaseInfo Captions { get; set; } = new();
    public List<VoicePackReleaseInfo> VoicePacks { get; set; } = [];
    public PayloadDownloadInfo Payload { get; set; } = new();
}

public sealed class DotaBuildInfo
{
    public string ClientVersion { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
}

public sealed class CaptionReleaseInfo
{
    public int Tokens { get; set; }
    public int EnglishAudioAliases { get; set; }
    public int PayloadEntries { get; set; }
    public int Files { get; set; }
    public CaptionSourceInfo Sources { get; set; } = new();
}

public sealed class CaptionSourceInfo
{
    public int Official { get; set; }
    public int Community { get; set; }
    public int Suggested { get; set; }
}

public sealed class VoicePackReleaseInfo
{
    public string Id { get; set; } = string.Empty;
    public int Lines { get; set; }
}

public sealed class PayloadDownloadInfo
{
    public string Url { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public string Sha256 { get; set; } = string.Empty;
}

public sealed class PayloadManifest
{
    public int SchemaVersion { get; set; }
    public string Version { get; set; } = string.Empty;
    public List<PayloadFileInfo> Files { get; set; } = [];
}

public sealed class PayloadFileInfo
{
    public string Path { get; set; } = string.Empty;
    public long Bytes { get; set; }
    public string Sha256 { get; set; } = string.Empty;
}
