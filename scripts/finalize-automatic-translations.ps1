[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [int]$TranslatorProcessId
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

if (Get-Process -Id $TranslatorProcessId -ErrorAction SilentlyContinue) {
    Wait-Process -Id $TranslatorProcessId
}

Set-Location -LiteralPath $repoRoot
& node scripts/sync-persona-catalog.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao atualizar o catálogo de personas."
}

& node scripts/build-local-caption-pack.mjs
if ($LASTEXITCODE -ne 0) {
    throw "Falha ao reconstruir o pacote local de captions."
}

Write-Host "Traduções finalizadas, personas sincronizadas e pacote local reconstruído."
