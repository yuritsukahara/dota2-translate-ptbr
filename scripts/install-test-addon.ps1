[CmdletBinding()]
param(
    [string]$DotaRoot = $env:DOTA2_ROOT,
    [string]$AddonName = "dota2_translate_ptbr",
    [switch]$SkipCompile,
    [switch]$CleanAudio
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $DotaRoot) {
    $DotaRoot = "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta"
}
$DotaRoot = [System.IO.Path]::GetFullPath($DotaRoot)

$contentBase = Join-Path $DotaRoot "content\dota_addons"
$gameBase = Join-Path $DotaRoot "game\dota_addons"
$contentTarget = Join-Path $contentBase $AddonName
$gameTarget = Join-Path $gameBase $AddonName
$sourceAudio = Join-Path $repoRoot "build\content\dota2_translate_ptbr"
$sourceGame = Join-Path $repoRoot "addon\game"
$templateMap = Join-Path $contentBase "addon_template\maps\template_map.vmap"
$compiler = Join-Path $DotaRoot "game\bin\win64\resourcecompiler.exe"

foreach ($required in @($contentBase, $gameBase, $sourceAudio, $sourceGame, $templateMap)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Caminho necessário não encontrado: $required"
    }
}
if (-not $SkipCompile -and -not (Test-Path -LiteralPath $compiler)) {
    throw "Resource Compiler não encontrado. Instale o DLC Dota 2 Workshop Tools."
}

New-Item -ItemType Directory -Force -Path $contentTarget, $gameTarget | Out-Null
if ($CleanAudio) {
    foreach ($audioTarget in @(
        (Join-Path $contentTarget "sounds\vo\axe"),
        (Join-Path $gameTarget "sounds\vo\axe")
    )) {
        $resolvedAudioTarget = [System.IO.Path]::GetFullPath($audioTarget)
        $resolvedAddonRoot = [System.IO.Path]::GetFullPath(
            $(if ($resolvedAudioTarget.StartsWith($contentTarget)) { $contentTarget } else { $gameTarget })
        )
        if (-not $resolvedAudioTarget.StartsWith($resolvedAddonRoot + [System.IO.Path]::DirectorySeparatorChar)) {
            throw "Recusa ao limpar caminho fora do addon: $resolvedAudioTarget"
        }
        if (Test-Path -LiteralPath $resolvedAudioTarget) {
            Remove-Item -LiteralPath $resolvedAudioTarget -Recurse -Force
        }
    }
}
Copy-Item -Path (Join-Path $sourceAudio "*") -Destination $contentTarget -Recurse -Force
Copy-Item -Path (Join-Path $sourceGame "*") -Destination $gameTarget -Recurse -Force
New-Item -ItemType Directory -Force -Path (Join-Path $contentTarget "maps") | Out-Null
Copy-Item -LiteralPath $templateMap -Destination (Join-Path $contentTarget "maps\template_map.vmap") -Force

if (-not $SkipCompile) {
    $inputs = Join-Path $contentTarget "*"
    & $compiler -i $inputs -r -nop4 -f
    if ($LASTEXITCODE -ne 0) {
        throw "Falha ao compilar o addon (código $LASTEXITCODE)."
    }
}

Write-Host "Addon instalado em:"
Write-Host "  Conteúdo: $contentTarget"
Write-Host "  Jogo:     $gameTarget"
Write-Host "Abra o Workshop Tools e execute: dota_launch_custom_game $AddonName template_map"
