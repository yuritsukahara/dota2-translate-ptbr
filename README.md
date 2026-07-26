# Dota 2 Translate PT-BR

Projeto comunitário, não oficial e sem fins lucrativos para localizar as vozes do Dota 2 em português brasileiro.

O repositório começa com um laboratório completo do **Axe**: ele detecta no Dota instalado os 285 slots de voz base atuais, mantém um manifesto revisável e gera vozes-guia em PT-BR para testar a integração ponta a ponta.

> **Estado:** protótipo técnico. As 243 falas verbais com legenda oficial possuem rascunho e voz-guia PT-BR. As 41 vocalizações não verbais e o único asset sem legenda oficial ficam fora do lote.

## O que já funciona

- manifesto reproduzível dos 285 assets base do Axe;
- extração de 284 legendas oficiais EN do Axe (um slot não possui legenda associada);
- catálogo de 127 heróis e imagens sincronizado pelo OpenDota;
- geração local de 243 WAVs-guia com uma voz pt-BR licenciada pelo Windows;
- compilação comprovada em 243 recursos `.vsnd_c` pelos Dota 2 Workshop Tools;
- addon de laboratório instalável sem copiar ou redistribuir áudio da Valve;
- validação automática do CSV e regras para tradução, elenco, gravação e crédito;
- portal público responsivo com catálogo, progresso triplo, propostas, votos e moderação;
- autenticação Discord com conta mínima de 30 dias, papéis, auditoria e limites de uso;
- armazenamento D1 para dados e R2 separado para gravações pendentes/aprovadas;
- instalador Windows .NET 8 com descoberta da Steam, backup, reparo e restauração.
- idioma **Português-Brasil** visível no menu nativo de áudio por uma camada `dota_brazilian`, sem alterar o VPK base, executável ou DLL;
- Dockerfile e Docker Compose para executar o portal localmente.

## Portal comunitário

O portal está em [`web/`](web/README.md) e usa Vinext no Cloudflare Workers. A leitura do catálogo é pública; Discord é exigido apenas para enviar, votar, denunciar ou moderar.

```powershell
npm run web:seed
npm --prefix web install
npm run web:dev
```

Ou com Docker:

```powershell
docker compose up --build
```

Abra `http://localhost:3000`. O container executa o build Vinext/Vite no runtime local do Cloudflare e persiste D1/R2 de desenvolvimento no volume `portal-data`.

O progresso é deliberadamente separado:

- **traduzido:** texto aprovado;
- **gravado:** interpretação recebida e tecnicamente válida;
- **revisado:** áudio aprovado e incluído em uma release.

Um herói só chega a 100% quando todas as falas do inventário fixado ao build estão revisadas. Personas, narradores, cosméticos e eventos ficam fora desse denominador e terão campanhas próprias.

Para desenvolvimento local e configuração de Discord/D1/R2, consulte [`web/.env.example`](web/.env.example) e a documentação do portal. O site nunca armazena o áudio original da Valve.

## Instalador Windows

O projeto WPF self-contained está em [`installer/`](installer/README.md). Ele oferece instalação do addon, reparo por hash, backup automático e restauração. A instalação é bloqueada enquanto o Dota está aberto.

O aplicativo .NET ainda mantém seu modo normal desativado; o teste comprovado está isolado nos scripts `install-axe-client-test.ps1` e `restore-axe-client-test.ps1`. Eles bloqueiam a operação com o Dota aberto, mantêm backup e nunca sobrescrevem `pak01_dir.vpk`.

```powershell
dotnet test .\installer\Dota2Translate.Tests\Dota2Translate.Tests.csproj -c Release
dotnet publish .\installer\Dota2Translate.Installer\Dota2Translate.Installer.csproj -c Release -r win-x64 --self-contained true
```

## Fontes de legenda

O sincronizador lê os arquivos `resource/subtitles/subtitles_*_english.txt` do VPK local e cruza os tokens com os assets de voz. Para o Axe atual, há 284 correspondências em 285 assets; `axe_rival_13` não tem legenda oficial associada.

O primeiro lote é estrito: contém 243 falas verbais com legenda oficial, exclui 41 risadas, grunhidos, gemidos e outras vocalizações sem texto, e exclui o asset sem legenda. Os rascunhos ficam em `data/heroes/axe/spoken-ptbr.json`; as exclusões auditáveis ficam em `data/heroes/axe/nonverbal.json`.

O cliente **não inclui** `subtitles_axe_brazilian.txt`. Portanto:

- `source_en` é a legenda oficial em inglês;
- `source_status` registra se a correspondência foi encontrada;
- `pt_br` é texto comunitário, nunca apresentado como tradução oficial da Valve;
- o áudio original da Valve não é extraído nem hospedado.

Atualize o snapshot com:

```powershell
npm run sync:catalog
```

## Integração no cliente normal

Os [Dota 2 Workshop Tools](https://developer.valvesoftware.com/wiki/Dota_2_Workshop_Tools) dão uma rota oficial para **Custom Games/addons**. A Valve documenta que áudio fonte fica em `sounds` no conteúdo do addon e é compilado para `.vsnd`; o jogo não lê o WAV cru como recurso final ([documentação de áudio do Source 2](https://developer.valvesoftware.com/wiki/Soundscape_%28Source_2%29#Storing_Audio_Files)).

O cliente reconhece camadas oficiais como `dota_russian`. O laboratório comprovou que `AudioLanguage "brazilian"` ativa a busca automática por `game/dota_brazilian`. A camada:

1. adiciona **Português-Brasil** ao menu nativo de áudio;
2. monta seu próprio `pak01_dir.vpk` antes do `dota/pak01_dir.vpk`;
3. mantém o áudio original como fallback para todo slot ausente.

Arquivos `.vsnd_c` soltos na pasta de idioma são encontrados depois do VPK base e, portanto, não substituem as vozes. O instalador empacota somente os 243 recursos comunitários em `dota_brazilian/pak01_*.vpk`. Ele nunca sobrescreve `dota/pak01_dir.vpk`, não edita o `gameinfo.gi` principal, não toca em executáveis, não injeta DLL e não manipula VAC/CRC. A restauração remove somente a camada criada e devolve `boot.vcfg` byte a byte a partir do backup.

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
.\scripts\generate-test-voices.ps1 -SpokenOnly -Clean -Voice "Microsoft Daniel"
.\scripts\install-test-addon.ps1 -CleanAudio
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

Para testar as 243 falas-guia no cliente normal, feche o Dota e execute:

```powershell
.\scripts\generate-test-voices.ps1 -SpokenOnly -Clean -Voice "Microsoft Daniel"
.\scripts\install-test-addon.ps1 -CleanAudio
.\scripts\install-axe-client-test.ps1
```

Abra o Dota normalmente. Em **Configurações → Áudio**, confirme **Português-Brasil**. O instalador já seleciona esse idioma no `boot.vcfg`; vocalizações excluídas e o slot sem legenda continuam usando o áudio original.

Para restaurar:

```powershell
.\scripts\restore-axe-client-test.ps1
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
| `source_en` | legenda oficial inglesa extraída do VPK |
| `source_status` | `official_caption` ou `missing_official_caption` |
| `pt_br` | tradução ou rascunho em português da comunidade |
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
web/                        portal público, migrações D1 e APIs
installer/                  aplicativo Windows e testes de segurança
scripts/                    sync, validação, TTS-guia e instalação
build/                      artefatos locais ignorados pelo Git
```

## Direitos e atribuição

Dota 2, personagens e assets originais pertencem à Valve e/ou aos respectivos licenciantes. Este projeto não é afiliado nem endossado pela Valve e não inclui áudio original do jogo.

O código original deste repositório usa MIT. Textos e gravações criados pela comunidade usam CC BY 4.0, salvo indicação explícita compatível. Veja [LICENSE-CODE](LICENSE-CODE), [LICENSE-CONTENT](LICENSE-CONTENT) e [ATTRIBUTION.md](ATTRIBUTION.md).

O [Steam Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/) também se aplica ao uso dos Developer Tools e a eventual publicação no Workshop; atualmente ele limita, em regra, o conteúdo feito com as ferramentas da Valve a uso não comercial, salvo termos específicos.

## Roadmap

- validar o Axe em uma sessão do addon e substituir as falas-guia por gravações humanas;
- configurar as credenciais Discord e abrir a primeira rodada de votação;
- criar glossário PT-BR e guia de direção vocal por herói;
- automatizar relatório de cobertura por patch;
- adicionar um herói por vez, com responsável de tradução e de revisão;
- preparar proposta técnica e amostras para a Valve.
