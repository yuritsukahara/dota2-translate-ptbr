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
$bootPath = [System.IO.Path]::GetFullPath((Join-Path $gameRoot "dota\cfg\boot.vcfg"))
$vpkDirPath = [System.IO.Path]::GetFullPath((Join-Path $languageRoot "pak01_dir.vpk"))
$vpkArchivePath = [System.IO.Path]::GetFullPath((Join-Path $languageRoot "pak01_000.vpk"))
$installManifest = Join-Path $repoRoot "build\caption-client-test\installed.json"

if (-not $bootPath.StartsWith($gameRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Destino de configuração inesperado: $bootPath"
}
if (Get-Process -Name dota2 -ErrorAction SilentlyContinue) {
    throw "Feche o Dota 2 antes de reativar as captions."
}
if (-not (Test-Path -LiteralPath $installManifest)) {
    throw "O pacote de captions não está registrado como instalado. Use install-caption-client-test.ps1."
}
if (-not (Test-Path -LiteralPath $bootPath)) {
    throw "boot.vcfg não encontrado: $bootPath"
}
if (-not (Test-Path -LiteralPath $vpkDirPath) -or -not (Test-Path -LiteralPath $vpkArchivePath)) {
    throw "O VPK de captions está incompleto. Restaure e instale o pacote novamente."
}

$boot = Get-Content -LiteralPath $bootPath -Raw
$updated = [regex]::Replace(
    $boot,
    '("UILanguage"\s+")[^"]+(")',
    '${1}brazilian$2'
)
$updated = [regex]::Replace(
    $updated,
    '("AudioLanguage"\s+")[^"]+(")',
    '${1}brazilian$2'
)

if ($updated -notmatch '"UILanguage"\s+"brazilian"') {
    throw "Não foi possível ativar UILanguage brazilian em $bootPath"
}
if ($updated -notmatch '"AudioLanguage"\s+"brazilian"') {
    throw "Não foi possível ativar AudioLanguage brazilian em $bootPath"
}

if ($updated -ne $boot) {
    [System.IO.File]::WriteAllText(
        $bootPath,
        $updated,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Host "Idioma brazilian reativado; o cliente voltará a montar o VPK de captions."
}
else {
    Write-Host "O idioma brazilian já estava ativo."
}

$installed = Get-Content -LiteralPath $installManifest -Raw | ConvertFrom-Json
Write-Host "Pacote preservado: $($installed.tokens) tokens para $($installed.hero)."
Write-Host "No Dota, mantenha Configurações > Áudio > Opções > Exibir legendas ativado."
