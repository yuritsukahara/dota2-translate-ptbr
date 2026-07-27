# Laboratório local de vozes PT-BR

Este laboratório gera **pré-visualizações sintéticas para estudo**, usando uma
referência curta de cada personagem e captions PT-BR já catalogadas. Não existe
um arquivo de “DNA da voz”: o modelo faz condicionamento zero-shot a partir de
um WAV de referência. Os resultados ficam em `build/`, são marcados como
sintéticos no manifesto e recebem a marca-d'água PerTh do Chatterbox.

Não use estas prévias para se passar por pessoas, atribuir falas reais a
intérpretes ou publicar assets da Valve. Elas também não são aceitas como packs
comunitários no portal; o fluxo público continua sendo gravação consentida e
creditada.

## Configuração instalada

- Stability Matrix: `%APPDATA%\StabilityMatrix`
- ComfyUI: `%APPDATA%\StabilityMatrix\Packages\ComfyUI`
- Custom node: `TTS-Audio-Suite`
- Modelo: `ResembleAI/Chatterbox-Multilingual-pt-br`, versão V3
- Saída: WAV mono PCM 16-bit, 24 kHz
- GPU validada: NVIDIA RTX 3060 12 GB
- Workflow: `Dota PT-BR - Chatterbox.json`, na pasta de workflows do ComfyUI

As pequenas adaptações feitas no custom node estão versionadas em
`voice-lab/patches/tts-audio-suite-ptbr.patch`. Isso documenta a seleção
automática do checkpoint brasileiro, o limite contra fala descontrolada e a
marca-d'água obrigatória, mesmo que o TTS Audio Suite seja atualizado depois.
Para reaplicá-las em uma instalação compatível:

```powershell
Set-Location "$env:APPDATA\StabilityMatrix\Packages\ComfyUI\custom_nodes\TTS-Audio-Suite"
git apply --unidiff-zero "C:\caminho\do\projeto\voice-lab\patches\tts-audio-suite-ptbr.patch"
```

O checkpoint dedicado ao português brasileiro foi escolhido em vez do modelo
multilíngue genérico. O [card oficial do modelo PT-BR][ptbr] o descreve como
otimizado para português brasileiro. O [Chatterbox oficial][chatterbox] oferece
clonagem cross-language e a marca-d'água PerTh. O custom node segue o fluxo
recomendado pelo [ComfyUI para extensões][comfy-nodes]: pasta `custom_nodes` e
dependências instaladas no ambiente Python do próprio ComfyUI.

## Usar no ComfyUI

1. Abra o ComfyUI pelo Stability Matrix.
2. Em **Workflows**, carregue `Dota PT-BR - Chatterbox`.
3. No nó **Load Audio**, escolha
   `dota-voice-references/axe.wav` ou outro herói.
4. No nó **TTS Text**, cole exatamente uma caption PT-BR.
5. Execute e ouça o resultado em **Preview Audio**.
6. Para comparar interpretações, altere primeiro apenas a seed. Depois teste
   `exaggeration` entre 0,5 e 0,9 e `cfg_weight` entre 0,2 e 0,4.

O ajuste inicial é `exaggeration=0,7`, `cfg_weight=0,3`,
`temperature=0,75`, seed `42`. A integração local usa automaticamente o
checkpoint **PT-BR V3** quando a versão é V3 e o idioma é Portuguese. A geração
no nó foi limitada a 240 tokens para evitar áudio interminável quando o modelo
não encontra o token de fim.

## Referências e lotes reproduzíveis

Use sempre o Python do ComfyUI:

```powershell
$comfyPython = "$env:APPDATA\StabilityMatrix\Packages\ComfyUI\venv\Scripts\python.exe"

# Recria referências de 10 segundos para todo o catálogo verbal
& $comfyPython scripts/build-voice-references.py --all

# Cinco falas do Axe; arquivos existentes são preservados
& $comfyPython scripts/generate-voice-lab.py --hero axe --limit 5

# Cinco falas de cada herói disponível, retomável
& $comfyPython scripts/generate-voice-lab.py --all --limit 5

# Todas as captions disponíveis de um herói
& $comfyPython scripts/generate-voice-lab.py --hero axe --limit 0

# Regenerar deliberadamente um lote
& $comfyPython scripts/generate-voice-lab.py --hero axe --limit 5 --force
```

Cada linha é salva imediatamente e registrada em `manifest.json`; uma execução
interrompida pode ser retomada sem refazer WAVs existentes. A prioridade do
texto é: caption oficial PT-BR, prévia comunitária já existente e, por último,
tradução automática não revisada.

Foram montadas referências para 125 heróis falantes e o narrador padrão.
Marci e Wisp não recebem perfil porque o catálogo atual não contém fala verbal
útil para condicionamento.

## Comparação dos modelos

| Modelo | Uso neste projeto | Observação |
| --- | --- | --- |
| Chatterbox PT-BR V3 | Recomendado e instalado | Melhor ponto de partida para PT-BR e clonagem cross-language; marca-d'água embutida |
| Qwen3-TTS 0.6B/1.7B | Comparador futuro | Bom controle e voice cloning, mas o suporte publicado é “Portuguese” genérico |
| XTTS-v2 | Fallback | Clona com referência curta e suporta português, mas sem checkpoint BR dedicado |
| F5-TTS PT-BR | Experimento de dicção | Pode favorecer pronúncia brasileira, porém exige transcrição da referência e tende a demandar mais preparação |

O [XTTS-v2 oficial][xtts] declara português entre os 16 idiomas e clonagem com
um clipe curto. O TTS Audio Suite também oferece Qwen3 e F5, mas instalar todos
os motores de uma vez consumiria bastante disco e aumentaria o risco de
conflitos. Por isso a instalação atual é mínima e focada no piloto validado.

## Estratégia de produção

Não gere as dezenas de milhares de linhas de uma vez. Faça cinco por herói,
ouça pronúncia, nomes próprios, ritmo e similaridade, e só então avance para 20
e para o pack completo. Na RTX 3060, o piloto corrigido levou aproximadamente
um minuto por fala; o catálogo inteiro levaria semanas de GPU e ainda exigiria
revisão humana.

[ptbr]: https://huggingface.co/ResembleAI/Chatterbox-Multilingual-pt-br
[chatterbox]: https://github.com/resemble-ai/chatterbox
[comfy-nodes]: https://docs.comfy.org/development/core-concepts/custom-nodes
[xtts]: https://github.com/coqui-ai/TTS/blob/dev/docs/source/models/xtts.md
