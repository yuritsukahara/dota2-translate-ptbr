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

if (Get-Process -Name dota2 -ErrorAction SilentlyContinue) {
    throw "Feche o Dota 2 antes de restaurar."
}
if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Nenhum teste override instalado foi encontrado."
}
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json

foreach ($record in $manifest.files) {
    $destination = Join-Path $targetRoot $record.name
    $backup = Join-Path $backupRoot $record.name
    if (Test-Path -LiteralPath $destination) {
        Remove-Item -LiteralPath $destination -Force
    }
    if ($record.existed -and (Test-Path -LiteralPath $backup)) {
        Copy-Item -LiteralPath $backup -Destination $destination -Force
    }
}

if (-not $manifest.targetRootExisted -and
    (Test-Path -LiteralPath $targetRoot) -and
    -not (Get-ChildItem -LiteralPath $targetRoot -Force)) {
    Remove-Item -LiteralPath $targetRoot
}
if (-not $manifest.resourceRootExisted -and
    (Test-Path -LiteralPath $resourceRoot) -and
    -not (Get-ChildItem -LiteralPath $resourceRoot -Force)) {
    Remove-Item -LiteralPath $resourceRoot
}
Remove-Item -LiteralPath $manifestPath -Force
if (Test-Path -LiteralPath $backupRoot) {
    Remove-Item -LiteralPath $backupRoot -Recurse -Force
}

Write-Host "Teste override removido e arquivos anteriores restaurados."
