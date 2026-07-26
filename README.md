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

## Executar

```powershell
npm install
npm run validate
docker compose up --build
```

Portal: `http://localhost:3000`

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
