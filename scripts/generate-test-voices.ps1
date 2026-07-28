[CmdletBinding()]
param(
    [string]$Hero = "axe",
    [string]$Voice = "Microsoft Daniel",
    [ValidateRange(-10, 10)]
    [int]$Rate = -2,
    [ValidateRange(0, 100)]
    [int]$Volume = 100,
    [string]$Only = "",
    [Alias("Sample")]
    [switch]$SpokenOnly,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot "data\heroes\$Hero\lines.csv"
$outputRoot = Join-Path $repoRoot "build\content\dota2_translate_ptbr"
$heroOutput = Join-Path $outputRoot "sounds\vo\$Hero"

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Manifesto não encontrado: $manifestPath"
}

Add-Type -AssemblyName System.Speech
$synth = [System.Speech.Synthesis.SpeechSynthesizer]::new()
$installed = @($synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name })
if ($Voice -notin $installed) {
    $ptBrVoice = $synth.GetInstalledVoices() |
        Where-Object { $_.VoiceInfo.Culture.Name -eq "pt-BR" } |
        Select-Object -First 1
    if (-not $ptBrVoice) {
        throw "Nenhuma voz pt-BR do Windows foi encontrada. Instaladas: $($installed -join ', ')"
    }
    $Voice = $ptBrVoice.VoiceInfo.Name
    Write-Warning "Voz solicitada ausente; usando '$Voice'."
}

$synth.SelectVoice($Voice)
$synth.Rate = $Rate
$synth.Volume = $Volume
$format = [System.Speech.AudioFormat.SpeechAudioFormatInfo]::new(
    24000,
    [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
    [System.Speech.AudioFormat.AudioChannel]::Mono
)

$lines = Import-Csv -LiteralPath $manifestPath
if ($SpokenOnly) {
    $spokenPath = Join-Path $repoRoot "data\heroes\$Hero\spoken-ptbr.json"
    if (-not (Test-Path -LiteralPath $spokenPath)) {
        throw "Lista de falas verbais não encontrada: $spokenPath"
    }
    $spokenIds = @((Get-Content -LiteralPath $spokenPath -Raw | ConvertFrom-Json).PSObject.Properties.Name)
    $lines = @($lines | Where-Object { $_.id -in $spokenIds })
}
if ($Only) {
    $lines = @($lines | Where-Object { $_.id -like $Only })
}
if ($Clean -and (Test-Path -LiteralPath $heroOutput)) {
    $resolvedBuild = [System.IO.Path]::GetFullPath((Join-Path $repoRoot "build"))
    $resolvedHeroOutput = [System.IO.Path]::GetFullPath($heroOutput)
    if (-not $resolvedHeroOutput.StartsWith($resolvedBuild + [System.IO.Path]::DirectorySeparatorChar)) {
        throw "Recusa ao limpar caminho fora de build: $resolvedHeroOutput"
    }
    Remove-Item -LiteralPath $resolvedHeroOutput -Recurse -Force
}

$generated = 0
try {
    foreach ($line in $lines) {
        if (-not $line.pt_br) {
            Write-Warning "Ignorando $($line.id): pt_br vazio."
            continue
        }

        $relative = $line.asset_path -replace "\.vsnd_c$", ".wav"
        $destination = Join-Path $outputRoot ($relative -replace "/", "\")
        $destinationDirectory = Split-Path -Parent $destination
        New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null

        if ($line.voice_direction -match "derrotado|pesado") {
            $synth.Rate = [Math]::Max(-10, $Rate - 2)
        }
        elseif ($line.voice_direction -match "ritmo rápido") {
            $synth.Rate = [Math]::Min(10, $Rate + 1)
        }
        else {
            $synth.Rate = $Rate
        }
        $synth.SetOutputToWaveFile($destination, $format)
        $synth.Speak($line.pt_br)
        $synth.SetOutputToNull()
        $generated += 1
    }
}
finally {
    $synth.Dispose()
}

Write-Host "Geradas $generated vozes de teste com '$Voice' em $outputRoot"
