[CmdletBinding()]
param(
    [string]$DotaRoot = $env:DOTA2_ROOT
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $DotaRoot) {
    $DotaRoot = "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta"
}
$DotaRoot = [System.IO.Path]::GetFullPath($DotaRoot)
$gameRoot = [System.IO.Path]::GetFullPath((Join-Path $DotaRoot "game"))
$languageRoot = [System.IO.Path]::GetFullPath((Join-Path $gameRoot "dota_brazilian"))
$target = [System.IO.Path]::GetFullPath((Join-Path $languageRoot "resource\subtitles"))
$bootPath = Join-Path $gameRoot "dota\cfg\boot.vcfg"
$stateRoot = Join-Path $repoRoot "build\caption-client-test"
$backupTarget = Join-Path $stateRoot "previous-subtitles"
$bootBackup = Join-Path $stateRoot "boot.vcfg.backup"
$vpkDirPath = Join-Path $languageRoot "pak01_dir.vpk"
$vpkArchivePath = Join-Path $languageRoot "pak01_000.vpk"
$vpkDirBackup = Join-Path $stateRoot "pak01_dir.vpk.backup"
$vpkArchiveBackup = Join-Path $stateRoot "pak01_000.vpk.backup"
$installManifest = Join-Path $stateRoot "installed.json"

if (-not $target.StartsWith($languageRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Destino de captions inesperado: $target"
}
if (Get-Process -Name dota2 -ErrorAction SilentlyContinue) {
    throw "Feche o Dota 2 antes de restaurar."
}
if (-not (Test-Path -LiteralPath $installManifest)) {
    throw "Nenhum teste de captions instalado foi encontrado."
}
$installed = Get-Content -LiteralPath $installManifest -Raw | ConvertFrom-Json

if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
}
if (Test-Path -LiteralPath $backupTarget) {
    Move-Item -LiteralPath $backupTarget -Destination $target
}
if (Test-Path -LiteralPath $bootBackup) {
    Copy-Item -LiteralPath $bootBackup -Destination $bootPath -Force
    Remove-Item -LiteralPath $bootBackup -Force
}
if ($installed.vpkPacked) {
    if (Test-Path -LiteralPath $vpkDirPath) {
        Remove-Item -LiteralPath $vpkDirPath -Force
    }
    if (Test-Path -LiteralPath $vpkDirBackup) {
        Move-Item -LiteralPath $vpkDirBackup -Destination $vpkDirPath
    }
    if (Test-Path -LiteralPath $vpkArchivePath) {
        Remove-Item -LiteralPath $vpkArchivePath -Force
    }
    if (Test-Path -LiteralPath $vpkArchiveBackup) {
        Move-Item -LiteralPath $vpkArchiveBackup -Destination $vpkArchivePath
    }
}
Remove-Item -LiteralPath $installManifest -Force

Write-Host "Teste de captions removido e estado anterior restaurado."
