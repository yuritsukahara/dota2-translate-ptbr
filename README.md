# Dota 2 Translate PT-BR

Projeto comunitário para catalogar as voicelines de Dota 2, organizar um elenco brasileiro por herói e reunir apoio público para uma dublagem oficial em português brasileiro.

O portal está em [`web/`](web/README.md), usa Vite por meio do Vinext, Cloudflare D1 para dados e R2 apenas para gravações enviadas pela comunidade. Todo o ambiente local também roda em Docker.

## Estado do catálogo

O sincronizador lê o VPK do Dota instalado, cruza os arquivos `subtitles_*_english.txt` e `subtitles_*_brazilian.txt` com os assets de voz e fixa o resultado ao build do cliente.

```powershell
npm run sync:official-voices
```

Snapshot atual:

- 127 heróis em ordem alfabética;
- 55.357 voicelines com caption oficial em inglês;
- 284 falas catalogadas para o Axe;
- nenhuma caption oficial PT-BR base por herói encontrada neste build;
- gemidos e slots sem fala não entram na campanha de dublagem.

Uma linha só aparece como “oficial PT-BR” quando o texto existe no arquivo brasileiro do próprio jogo. O projeto não apresenta rascunhos comunitários como tradução da Valve.

## Regra do elenco

1. A audição abre somente quando o herói possui ao menos cinco captions oficiais PT-BR.
2. Cada candidato grava exatamente as mesmas cinco linhas.
3. A comunidade comenta, curte, desaprova e vota.
4. Revisores verificam direitos, interpretação, formato e qualidade técnica.
5. O vencedor recebe um pack exclusivo e envia todas as falas restantes.
6. Um herói nunca mistura gravações de autores diferentes.

Os envios devem ser WAV PCM mono, 16-bit, 24/48 kHz, até 20 segundos e 10 MB, com consentimento, crédito e licença CC BY 4.0. Áudio extraído do jogo e clonagem ou imitação sem autorização são rejeitados.

## Login e petição

O portal usa somente Steam OpenID. Cada Steam ID pode assinar uma vez a carta pública que pede à Valve uma dublagem oficial em PT-BR. A petição destaca a história, o humor, os campeonatos e a paixão da comunidade brasileira sem afirmar apoio ou promessa da Valve.

## Áudio original e captions

O catálogo guarda o caminho técnico do som dentro da instalação local do Dota.
Quando existe um arquivo individual no Fandom, o player do portal abre essa
origem externa diretamente e mostra o crédito e a página Responses; o arquivo
não é copiado para o servidor do projeto. A fonte canônica do inventário continua
sendo o cliente instalado.

A rota `/captions` é dedicada somente às captions oficiais, com seleção de
herói, busca e filtros separados do fluxo de audições.

## Prévia automática pelo Codex

As captions inglesas sem equivalente oficial PT-BR podem receber uma prévia
gerada pelo Codex autenticado com a assinatura do ChatGPT:

```powershell
npm run translations:codex
```

O processo usa checkpoint em `build/`, pode ser retomado sem refazer os lotes
concluídos e consulta o glossário extraído dos arquivos oficiais para preservar
nomes de heróis e itens. Na interface, esse conteúdo aparece sempre como
**tradução automática · não revisada**. Ele não é apresentado como texto da
Valve nem substitui sugestões, votos ou revisão humana da comunidade.

## Executar

```powershell
npm install
npm run validate
docker compose up --build
```

Portal: `http://localhost:3000`

## Catálogo MP3 local

As voicelines `.vsnd_c` do Dota contêm um fluxo MP3 original. O gerador remove
somente o invólucro Source 2, sem recomprimir, e cria um HTML local com busca,
filtro por herói, players e captions lado a lado:

```powershell
# Apenas Axe
npm run audio:catalog -- --hero axe

# Todos os heróis catalogados
npm run audio:catalog -- --all

# Apenas estimar quantidade e espaço
npm run audio:catalog -- --all --dry-run

# Recriar somente o HTML, sem extrair novamente
npm run audio:catalog -- --index-only
```

Abra `build/local-audio/index.html`. A pasta `build/` é ignorada pelo Git e não
entra no site público.

Para usar players com carregamento e navegação mais rápidos:

```powershell
npm run audio:serve
```

Depois abra `http://127.0.0.1:4173`. O servidor aceita conexões somente desta
máquina.

## Estrutura

```text
scripts/                     sincronização e validação do VPK
web/                         portal Vinext, APIs, D1 e R2
web/data/heroes.json         catálogo de heróis
web/data/voice-lines.json    captions e caminhos oficiais por build
installer/                   laboratório reversível do instalador Windows
addon/                       protótipos técnicos históricos
```

## Atribuição

Dota 2, personagens e assets originais pertencem à Valve e/ou aos respectivos licenciantes. Este projeto é comunitário, independente e não afiliado, endossado ou patrocinado pela Valve. Gravações comunitárias permanecem creditadas aos seus autores.
