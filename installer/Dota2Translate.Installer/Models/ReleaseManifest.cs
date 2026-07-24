namespace Dota2TranslatePTBR.Models;

public sealed record ReleaseManifest(
    string Version,
    string BuildId,
    string PackageFile,
    string Sha256,
    string Signature,
    int ReviewedLines,
    int TotalLines,
    LabCompatibility? NormalClient);

public sealed record LabCompatibility(bool Enabled, string GameInfoSha256, string SearchPath);
