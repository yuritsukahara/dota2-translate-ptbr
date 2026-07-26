[CmdletBinding()]
param(
    [string]$Hero = "axe",
    [string]$Voice = "Microsoft Daniel",
    [ValidateRange(-10, 10)]
    [int]$Rate = -2,
    [ValidateRange(0, 100)]
    [int]$Volume = 100,
    [string]$Only = "",
    [switch]$Sample
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot "data\heroes\$Hero\lines.csv"
$outputRoot = Join-Path $repoRoot "build\content\dota2_translate_ptbr"

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
if ($Sample) {
    $samplePath = Join-Path $repoRoot "data\heroes\$Hero\sample-ptbr.json"
    if (-not (Test-Path -LiteralPath $samplePath)) {
        throw "Lista de amostras não encontrada: $samplePath"
    }
    $sampleIds = @((Get-Content -LiteralPath $samplePath -Raw | ConvertFrom-Json).PSObject.Properties.Name)
    $lines = @($lines | Where-Object { $_.id -in $sampleIds })
}
if ($Only) {
    $lines = @($lines | Where-Object { $_.id -like $Only })
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
