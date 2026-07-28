[CmdletBinding()]
param(
    [string]$DotaRoot = $env:DOTA2_ROOT,
    [string]$Hero,
    [switch]$ForceExperimental
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
$vpkOutputBase = Join-Path $stateRoot "pak01-caption-test"
$vpkOverlay = Join-Path $stateRoot "vpk-overlay"
$installManifest = Join-Path $stateRoot "installed.json"
$packRoot = Join-Path $repoRoot "build\caption-pack\dota_brazilian"
$anchorRoot = Join-Path $repoRoot "build\caption-anchor-test"
$source = Join-Path $anchorRoot "resource\subtitles"

if (-not $target.StartsWith($languageRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Destino de captions inesperado: $target"
}
if (Get-Process -Name dota2 -ErrorAction SilentlyContinue) {
    throw "Feche o Dota 2 antes de instalar as captions."
}
if (-not (Test-Path -LiteralPath $bootPath)) {
    throw "boot.vcfg não encontrado: $bootPath"
}
if (Test-Path -LiteralPath $installManifest) {
    throw "Já existe um teste de captions instalado. Restaure antes de reinstalar."
}

$builderArgs = @((Join-Path $repoRoot "scripts\build-local-caption-pack.mjs"))
if ($Hero) {
    $builderArgs += @("--hero", $Hero)
}
& node @builderArgs
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao gerar o pacote de captions."
}
& node (Join-Path $repoRoot "scripts\build-caption-anchor-test.mjs")
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao incorporar os tokens ao arquivo-âncora do announcer."
}
if (-not (Test-Path -LiteralPath $source)) {
    throw "Arquivo-âncora de captions não encontrado: $source"
}

New-Item -ItemType Directory -Path $stateRoot -Force | Out-Null
if (Test-Path -LiteralPath $backupTarget) {
    throw "Backup pendente encontrado: $backupTarget"
}
if (Test-Path -LiteralPath $target) {
    Move-Item -LiteralPath $target -Destination $backupTarget
}
Copy-Item -LiteralPath $bootPath -Destination $bootBackup -Force
if (Test-Path -LiteralPath $vpkDirPath) {
    Copy-Item -LiteralPath $vpkDirPath -Destination $vpkDirBackup -Force
}
if (Test-Path -LiteralPath $vpkArchivePath) {
    Copy-Item -LiteralPath $vpkArchivePath -Destination $vpkArchiveBackup -Force
}

try {
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Recurse

    if (Test-Path -LiteralPath $vpkOverlay) {
        Remove-Item -LiteralPath $vpkOverlay -Recurse -Force
    }
    $overlaySubtitles = Join-Path $vpkOverlay "resource\subtitles"
    New-Item -ItemType Directory -Path $overlaySubtitles -Force | Out-Null
    Copy-Item -Path (Join-Path $source "*.txt") -Destination $overlaySubtitles
    Get-ChildItem -LiteralPath $overlaySubtitles -Filter "*_brazilian.txt" | ForEach-Object {
        $stagingName = $_.Name -replace '\.txt$', '_staging.txt'
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $overlaySubtitles $stagingName)
    }

    $packerArgs = @(
        (Join-Path $repoRoot "scripts\pack-language-vpk.mjs"),
        $vpkOverlay,
        $vpkOutputBase
    )
    if (Test-Path -LiteralPath $vpkDirPath) {
        $packerArgs += @("--base", $vpkDirPath)
    }
    & node @packerArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao incorporar as captions ao VPK de idioma."
    }
    Move-Item -LiteralPath "${vpkOutputBase}_dir.vpk" -Destination $vpkDirPath -Force
    Move-Item -LiteralPath "${vpkOutputBase}_000.vpk" -Destination $vpkArchivePath -Force
    Remove-Item -LiteralPath $vpkOverlay -Recurse -Force

    $boot = Get-Content -LiteralPath $bootPath -Raw
    $updated = [regex]::Replace(
        $boot,
        '("UILanguage"\s+")[^"]+(")',
        '${1}brazilian$2'
    )
    if ($updated -eq $boot -and $boot -notmatch '"UILanguage"\s+"brazilian"') {
        throw "Não foi possível localizar UILanguage em $bootPath"
    }
    [System.IO.File]::WriteAllText(
        $bootPath,
        $updated,
        [System.Text.UTF8Encoding]::new($false)
    )

    $packManifest = Get-Content -LiteralPath (Join-Path $packRoot "caption-pack-manifest.json") -Raw | ConvertFrom-Json
    $installed = [ordered]@{
        installedAt = [DateTimeOffset]::UtcNow.ToString("o")
        dotaRoot = $DotaRoot
        language = "brazilian"
        hero = if ($Hero) { $Hero } else { "all" }
        files = $packManifest.files
        tokens = $packManifest.tokens
        vpkPacked = $true
    }
    $installed | ConvertTo-Json | Set-Content -LiteralPath $installManifest -Encoding utf8
}
catch {
    if (Test-Path -LiteralPath $target) {
        Remove-Item -LiteralPath $target -Recurse -Force
    }
    if (Test-Path -LiteralPath $backupTarget) {
        Move-Item -LiteralPath $backupTarget -Destination $target
    }
    if (Test-Path -LiteralPath $bootBackup) {
        Copy-Item -LiteralPath $bootBackup -Destination $bootPath -Force
    }
    if (Test-Path -LiteralPath $vpkDirBackup) {
        Copy-Item -LiteralPath $vpkDirBackup -Destination $vpkDirPath -Force
    }
    elseif (Test-Path -LiteralPath $vpkDirPath) {
        Remove-Item -LiteralPath $vpkDirPath -Force
    }
    if (Test-Path -LiteralPath $vpkArchiveBackup) {
        Copy-Item -LiteralPath $vpkArchiveBackup -Destination $vpkArchivePath -Force
    }
    elseif (Test-Path -LiteralPath $vpkArchivePath) {
        Remove-Item -LiteralPath $vpkArchivePath -Force
    }
    if (Test-Path -LiteralPath $vpkOverlay) {
        Remove-Item -LiteralPath $vpkOverlay -Recurse -Force
    }
    throw
}

Write-Host "Captions PT-BR instaladas: $($installed.tokens) tokens do catálogo em uma âncora carregada pelo cliente."
Write-Host "No Dota, ative Configurações > Áudio > Opções > Exibir legendas."
Write-Host "Para desfazer: .\scripts\restore-caption-client-test.ps1"
