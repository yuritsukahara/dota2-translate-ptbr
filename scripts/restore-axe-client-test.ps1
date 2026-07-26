[CmdletBinding()]
param([string]$DotaRoot = $env:DOTA2_ROOT)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $DotaRoot) {
    $DotaRoot = "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta"
}
$DotaRoot = [System.IO.Path]::GetFullPath($DotaRoot)
$gameRoot = [System.IO.Path]::GetFullPath((Join-Path $DotaRoot "game"))
$target = [System.IO.Path]::GetFullPath((Join-Path $gameRoot "dota_brazilian"))
$stateRoot = Join-Path $repoRoot "build\client-test"
$backupTarget = Join-Path $stateRoot "previous-dota_brazilian"
$bootPath = Join-Path $gameRoot "dota\cfg\boot.vcfg"
$bootBackup = Join-Path $stateRoot "boot.vcfg.backup"

if ($target -ne (Join-Path $gameRoot "dota_brazilian")) {
    throw "Destino de idioma inesperado: $target"
}
if (Get-Process -Name dota2 -ErrorAction SilentlyContinue) {
    throw "Feche o Dota 2 antes de restaurar."
}
if (-not (Test-Path -LiteralPath $bootBackup)) {
    throw "Nenhuma instalação de teste com backup foi encontrada."
}

if (Test-Path -LiteralPath $target) {
    Remove-Item -LiteralPath $target -Recurse -Force
}
if (Test-Path -LiteralPath $backupTarget) {
    Move-Item -LiteralPath $backupTarget -Destination $target
}
Copy-Item -LiteralPath $bootBackup -Destination $bootPath -Force
Remove-Item -LiteralPath $bootBackup -Force

Write-Host "Teste removido e idioma anterior restaurado."
