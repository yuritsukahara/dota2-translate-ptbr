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
$gameRoot = [System.IO.Path]::GetFullPath((Join-Path $DotaRoot "game\dota"))
$resourceRoot = [System.IO.Path]::GetFullPath((Join-Path $gameRoot "resource"))
$targetRoot = [System.IO.Path]::GetFullPath((Join-Path $resourceRoot "subtitles"))
$stateRoot = Join-Path $repoRoot "build\caption-override-test"
$backupRoot = Join-Path $stateRoot "backup"
$manifestPath = Join-Path $stateRoot "installed.json"
$packRoot = Join-Path $repoRoot "build\caption-pack\dota_brazilian\resource\subtitles"
$anchorRoot = Join-Path $repoRoot "build\caption-anchor-test\resource\subtitles"

if (-not $targetRoot.StartsWith($gameRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Destino de captions inesperado: $targetRoot"
}
if (Get-Process -Name dota2 -ErrorAction SilentlyContinue) {
    throw "Feche o Dota 2 antes de instalar o teste."
}
if (Test-Path -LiteralPath $manifestPath) {
    throw "Já existe um teste override instalado. Restaure-o primeiro."
}

& node (Join-Path $repoRoot "scripts\build-local-caption-pack.mjs") --hero axe
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao gerar as captions do Axe."
}
$source = Join-Path $packRoot "subtitles_axe_brazilian.txt"
if (-not (Test-Path -LiteralPath $source)) {
    throw "Caption gerada não encontrada: $source"
}
& node (Join-Path $repoRoot "scripts\build-caption-anchor-test.mjs")
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao gerar o arquivo-âncora de captions."
}
$anchorSource = Join-Path $anchorRoot "subtitles_announcer_brazilian.txt"
if (-not (Test-Path -LiteralPath $anchorSource)) {
    throw "Arquivo-âncora não encontrado: $anchorSource"
}

New-Item -ItemType Directory -Path $stateRoot -Force | Out-Null
$resourceRootExisted = Test-Path -LiteralPath $resourceRoot
$targetRootExisted = Test-Path -LiteralPath $targetRoot
$sources = @(
    [ordered]@{
        name = "subtitles_axe_brazilian.txt"
        source = $source
    },
    [ordered]@{
        name = "subtitles_axe_brazilian_staging.txt"
        source = $source
    },
    [ordered]@{
        name = "subtitles_announcer_brazilian.txt"
        source = $anchorSource
    }
)
$records = @()

try {
    New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
    foreach ($entry in $sources) {
        $destination = Join-Path $targetRoot $entry.name
        $backup = Join-Path $backupRoot $entry.name
        $existed = Test-Path -LiteralPath $destination
        if ($existed) {
            New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
            Copy-Item -LiteralPath $destination -Destination $backup -Force
        }
        Copy-Item -LiteralPath $entry.source -Destination $destination -Force
        $records += [ordered]@{
            name = $entry.name
            existed = $existed
        }
    }
    [ordered]@{
        installedAt = [DateTimeOffset]::UtcNow.ToString("o")
        dotaRoot = $DotaRoot
        resourceRootExisted = $resourceRootExisted
        targetRootExisted = $targetRootExisted
        files = $records
    } | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $manifestPath -Encoding utf8
}
catch {
    foreach ($record in $records) {
        $destination = Join-Path $targetRoot $record.name
        $backup = Join-Path $backupRoot $record.name
        if (Test-Path -LiteralPath $destination) {
            Remove-Item -LiteralPath $destination -Force
        }
        if ($record.existed -and (Test-Path -LiteralPath $backup)) {
            Copy-Item -LiteralPath $backup -Destination $destination -Force
        }
    }
    throw
}

Write-Host "Captions do Axe instaladas, incluindo a âncora do announcer, para teste com -override_vpk."
Write-Host "Para desfazer: .\scripts\restore-caption-override-test.ps1"
