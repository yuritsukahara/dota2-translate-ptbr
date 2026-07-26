[CmdletBinding()]
param(
    [string]$DotaRoot = $env:DOTA2_ROOT,
    [string]$AddonName = "dota2_translate_ptbr",
    [switch]$KeepCurrentAudioLanguage
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $DotaRoot) {
    $DotaRoot = "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta"
}
$DotaRoot = [System.IO.Path]::GetFullPath($DotaRoot)
$gameRoot = [System.IO.Path]::GetFullPath((Join-Path $DotaRoot "game"))
$target = [System.IO.Path]::GetFullPath((Join-Path $gameRoot "dota_brazilian"))
$compiledRoot = Join-Path $gameRoot "dota_addons\$AddonName\sounds\vo\axe"
$samplePath = Join-Path $repoRoot "data\heroes\axe\sample-ptbr.json"
$stateRoot = Join-Path $repoRoot "build\client-test"
$backupTarget = Join-Path $stateRoot "previous-dota_brazilian"
$bootPath = Join-Path $gameRoot "dota\cfg\boot.vcfg"
$bootBackup = Join-Path $stateRoot "boot.vcfg.backup"

if ($target -ne (Join-Path $gameRoot "dota_brazilian")) {
    throw "Destino de idioma inesperado: $target"
}
if (Get-Process -Name dota2 -ErrorAction SilentlyContinue) {
    throw "Feche o Dota 2 antes de instalar o teste."
}
foreach ($required in @($compiledRoot, $samplePath, $bootPath)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Caminho necessário não encontrado: $required"
    }
}

New-Item -ItemType Directory -Force -Path $stateRoot | Out-Null
if (Test-Path -LiteralPath $backupTarget) {
    throw "Já existe um backup pendente em $backupTarget. Execute restore-axe-client-test.ps1 primeiro."
}
if (Test-Path -LiteralPath $target) {
    Move-Item -LiteralPath $target -Destination $backupTarget
}
Copy-Item -LiteralPath $bootPath -Destination $bootBackup -Force

try {
    $audioTarget = Join-Path $target "sounds\vo\axe"
    New-Item -ItemType Directory -Force -Path $audioTarget | Out-Null
    $gameInfo = @'
"GameInfo"
{
    LayeredOnMod dota

    FileSystem
    {
        SearchPaths
        {
            Game dota_brazilian
            Game dota
            Game core
            Mod dota_brazilian
            Mod dota
            AddonRoot dota_addons
            PublicContent core
        }
    }
}
'@
    [System.IO.File]::WriteAllText(
        (Join-Path $target "gameinfo.gi"),
        $gameInfo,
        [System.Text.UTF8Encoding]::new($false)
    )

    $sampleIds = @((Get-Content -LiteralPath $samplePath -Raw | ConvertFrom-Json).PSObject.Properties.Name)
    $copied = 0
    foreach ($id in $sampleIds) {
        $source = Join-Path $compiledRoot "$id.vsnd_c"
        if (-not (Test-Path -LiteralPath $source)) {
            throw "Áudio compilado ausente: $source"
        }
        Copy-Item -LiteralPath $source -Destination (Join-Path $audioTarget "$id.vsnd_c") -Force
        $copied += 1
    }

    if (-not $KeepCurrentAudioLanguage) {
        $boot = Get-Content -LiteralPath $bootPath -Raw
        $updated = [regex]::Replace(
            $boot,
            '("AudioLanguage"\s+")[^"]+(")',
            '${1}brazilian$2'
        )
        if ($updated -eq $boot -and $boot -notmatch '"AudioLanguage"\s+"brazilian"') {
            throw "Não foi possível localizar AudioLanguage em $bootPath"
        }
        [System.IO.File]::WriteAllText(
            $bootPath,
            $updated,
            [System.Text.UTF8Encoding]::new($false)
        )
    }
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
    throw
}

Write-Host "Teste do Axe instalado com $copied vozes-guia."
Write-Host "O menu Áudio agora pode usar Português-Brasil."
Write-Host "Para desfazer: .\scripts\restore-axe-client-test.ps1"
