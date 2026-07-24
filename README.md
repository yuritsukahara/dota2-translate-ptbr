# Dota 2 Translate PT-BR

Projeto comunitário, não oficial e sem fins lucrativos para localizar as vozes do Dota 2 em português brasileiro.

O repositório começa com um laboratório completo do **Axe**: ele detecta no Dota instalado os 285 slots de voz base atuais, mantém um manifesto revisável e gera vozes-guia em PT-BR para testar a integração ponta a ponta.

> **Estado:** protótipo técnico. As falas-guia dizem o contexto e o número do asset; elas não são a tradução final nem imitam o ator original.

## O que já funciona

- manifesto reproduzível dos 285 assets base do Axe;
- geração local de 285 WAVs-guia com uma voz pt-BR do Windows;
- compilação comprovada em 285 recursos `.vsnd_c` pelos Dota 2 Workshop Tools;
- addon de laboratório instalável sem copiar ou redistribuir áudio da Valve;
- validação automática do CSV e regras para tradução, elenco, gravação e crédito.

## Limite importante

Os [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools) dão uma rota oficial para **Custom Games/addons**. A Valve documenta que áudio fonte fica em `sounds` no conteúdo do addon e é compilado para `.vsnd`; o jogo não lê o WAV cru como recurso final ([documentação de áudio do Source 2](https://developer.valvesoftware.com/wiki/Soundscape_%28Source_2%29#Storing_Audio_Files)).

Isso não equivale a instalar uma nova dublagem nas partidas normais. O projeto não altera `pak01_dir.vpk`, `gameinfo.gi`, executáveis, memória do processo nem parâmetros de VAC. Não recomendamos “loaders”, DLL injection ou edição do cliente. A meta pública é:

1. produzir e revisar um pacote comunitário completo;
2. testá-lo de forma segura em um addon;
3. buscar uma integração oficial com a Valve/Steam Workshop.

## Teste rápido no Windows

Requisitos:

- Dota 2;
- DLC gratuito **Dota 2 Workshop Tools** instalado;
- Node.js 20+;
- PowerShell 7 ou Windows PowerShell 5.1;
- uma voz pt-BR do Windows (o script prefere `Microsoft Daniel`).

No PowerShell:

```powershell
npm run validate
.\scripts\generate-test-voices.ps1
.\scripts\install-test-addon.ps1
```

Se o Dota estiver em outra biblioteca:

```powershell
$env:DOTA2_ROOT = "D:\SteamLibrary\steamapps\common\dota 2 beta"
.\scripts\install-test-addon.ps1
```

Abra os Workshop Tools, entre no console e execute:

```text
dota_launch_custom_game dota2_translate_ptbr template_map
```

O instalador copia o mapa de exemplo da instalação local da Valve, compila o mapa e os WAVs, e grava o addon em:

```text
...\dota 2 beta\content\dota_addons\dota2_translate_ptbr
...\dota 2 beta\game\dota_addons\dota2_translate_ptbr
```

Para remover o laboratório, apague somente essas duas pastas `dota2_translate_ptbr`.

## Atualizar os slots depois de um patch

O script lê apenas o índice de nomes do VPK local e preserva o trabalho já existente:

```powershell
npm run sync:axe
npm run validate
```

Ele não extrai áudio, roteiro ou outros arquivos da Valve. Para outro herói:

```powershell
node .\scripts\sync-manifest.mjs --hero crystal_maiden
```

## Como colaborar

O arquivo central é [`data/heroes/axe/lines.csv`](data/heroes/axe/lines.csv):

| coluna | uso |
| --- | --- |
| `id` | nome estável da fala no jogo |
| `asset_path` | caminho de destino do recurso |
| `category` | contexto técnico |
| `pt_br` | texto em português aprovado pela comunidade |
| `status` | `placeholder`, `translated`, `recorded` ou `reviewed` |
| `actor` | nome/crédito escolhido pelo intérprete |
| `license` | licença da gravação, normalmente `CC-BY-4.0` |
| `notes` | intenção, pronúncia, timing e contexto |

Antes de abrir um PR:

```powershell
npm run validate
```

Leia o fluxo completo em [CONTRIBUTING.md](CONTRIBUTING.md). Em resumo:

- um PR deve tratar um herói ou lote pequeno;
- tradução e revisão devem ser feitas por pessoas diferentes;
- gravação final precisa de consentimento e crédito explícitos;
- não envie áudio extraído do jogo;
- não clone nem imite a voz de atores sem autorização documentada;
- WAV final: mono, PCM 16-bit, 24 ou 48 kHz, sem clipping e com pouco ruído.

## Estrutura

```text
addon/game/                 arquivos mínimos do Custom Game
audio/recordings/<heroi>/   gravações finais (Git LFS)
data/heroes/<heroi>/        manifesto de tradução
scripts/                    sync, validação, TTS-guia e instalação
build/                      artefatos locais ignorados pelo Git
```

## Direitos e atribuição

Dota 2, personagens e assets originais pertencem à Valve e/ou aos respectivos licenciantes. Este projeto não é afiliado nem endossado pela Valve e não inclui áudio original do jogo.

O código original deste repositório usa MIT. Textos e gravações criados pela comunidade usam CC BY 4.0, salvo indicação explícita compatível. Veja [LICENSE-CODE](LICENSE-CODE), [LICENSE-CONTENT](LICENSE-CONTENT) e [ATTRIBUTION.md](ATTRIBUTION.md).

O [Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/) também se aplica ao uso dos Developer Tools e a eventual publicação no Workshop; atualmente ele limita, em regra, o conteúdo feito com as ferramentas da Valve a uso não comercial, salvo termos específicos.

## Roadmap

- validar o Axe em uma sessão do addon e substituir as falas-guia por gravações humanas;
- criar glossário PT-BR e guia de direção vocal por herói;
- automatizar relatório de cobertura por patch;
- adicionar um herói por vez, com responsável de tradução e de revisão;
- preparar proposta técnica e amostras para a Valve.

