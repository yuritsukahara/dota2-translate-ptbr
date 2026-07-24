[CmdletBinding()]
param(
    [string]$Version = "0.1.0"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$distRoot = Join-Path $repoRoot "dist"
$stagingRoot = Join-Path $distRoot "dota2-translate-ptbr-axe-test-$Version"
$zipPath = "$stagingRoot.zip"
$audioSource = Join-Path $repoRoot "build\content\dota2_translate_ptbr\sounds"

if (-not (Test-Path -LiteralPath $audioSource)) {
    throw "Vozes não encontradas. Execute scripts\generate-test-voices.ps1 primeiro."
}

$wavCount = @(Get-ChildItem -LiteralPath $audioSource -Filter "*.wav" -Recurse).Count
if ($wavCount -ne 285) {
    throw "Esperados 285 WAVs do Axe; encontrados $wavCount."
}

New-Item -ItemType Directory -Force -Path $stagingRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $stagingRoot "build\content\dota2_translate_ptbr") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $stagingRoot "scripts") | Out-Null

Copy-Item -LiteralPath $audioSource -Destination (Join-Path $stagingRoot "build\content\dota2_translate_ptbr\sounds") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "addon") -Destination (Join-Path $stagingRoot "addon") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "scripts\install-test-addon.ps1") -Destination (Join-Path $stagingRoot "scripts\install-test-addon.ps1") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "README.md") -Destination (Join-Path $stagingRoot "README.md") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "LICENSE-CODE") -Destination (Join-Path $stagingRoot "LICENSE-CODE") -Force
Copy-Item -LiteralPath (Join-Path $repoRoot "LICENSE-CONTENT") -Destination (Join-Path $stagingRoot "LICENSE-CONTENT") -Force

Compress-Archive -LiteralPath $stagingRoot -DestinationPath $zipPath -CompressionLevel Optimal -Force
Write-Host "Release criada: $zipPath ($wavCount WAVs)"
