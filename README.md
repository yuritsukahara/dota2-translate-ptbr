# Dublagem Brasileira Dota 2

Portal pessoal para estudar e organizar uma dublagem brasileira comunitária de
Dota 2. O produto atual reúne o catálogo local, captions PT-BR, packs completos
por intérprete, perfis Steam e uma petição por áudio oficial.

## Snapshot do build 6869

- 127 heróis e 55.357 linhas base;
- 39 personas ou variantes e 19.878 linhas;
- narrador padrão com 2.074 linhas;
- 77.309 captions no total;
- 1.399 captions oficiais PT-BR;
- 4.604 traduções comunitárias;
- 71.306 traduções sugeridas;
- 77.296 MP3s no catálogo local, pois 13 vocalizações não verbais são excluídas.

A origem de cada texto permanece visível. O portal prioriza a caption oficial
PT-BR, depois a versão comunitária e, por fim, a tradução sugerida. Gemidos e
outros sons sem fala não entram no checklist de dublagem.

O áudio original e os retratos usados no ambiente pessoal são derivados da
instalação local do jogo. Arquivos de áudio não são versionados no Git.

## Fluxo atual

1. O inventário é extraído dos VPKs e fixado ao build do cliente.
2. Cada página reúne áudio local, caption oficial em inglês e texto PT-BR.
3. Uma pessoa autenticada pela Steam pode sugerir outra tradução.
4. O intérprete baixa um kit ZIP com README, estrutura e checklist do herói.
5. O pack completo é compartilhado por uma pasta do Google Drive.
6. O perfil Steam mostra somente os packs realmente enviados por aquele usuário.
7. A petição aceita uma assinatura pública por Steam ID.

Steam OpenID é a única identidade do portal. O áudio permanece no Google Drive
do intérprete e o portal guarda somente a contribuição enviada.

## Desenvolvimento

Requisitos: Node.js 22.13 ou superior e uma instalação local do Dota 2 para
reconstruir catálogos e áudio.

```powershell
npm install --prefix web
npm --prefix web run db:migrate:local
npm run web:dev
```

Abra `http://localhost:3000`. O portal não depende de Docker.

Para executar toda a verificação do repositório:

```powershell
npm run check
```

O guia técnico do portal está em [`web/README.md`](web/README.md).

## Catálogos e ferramentas locais

```powershell
# Atualizar inventário e captions a partir do jogo
npm run sync:catalog

# Auditar personas e variantes
npm run captions:audit

# Extrair os retratos alternativos
npm run images:personas

# Construir o catálogo MP3 completo
npm run audio:catalog -- --all
npm run audio:personas

# Servir os players locais
npm run audio:serve

# Consultar ou continuar as traduções sugeridas
npm run translations:status
npm run translations:codex
```

O catálogo de áudio fica em `build/local-audio/` e é preservado entre
execuções. Scripts de extração, captions, personas, MP3 e estudos de voz
permanecem no repositório.

## Material separado do produto

- [`docs/experiments/`](docs/experiments/) documenta testes de captions no
  cliente e o laboratório local de voz;
- [`docs/research/`](docs/research/) reúne estudos e modelos de contato;
- a planilha operacional de contatos permanece local e ignorada;
- `.vscode/`, `audio/compiled/`, `build/` e outros artefatos reconstruíveis são
  preservados localmente e ignorados pelo Git.

## Atribuição

Dota 2, personagens, marcas e assets originais pertencem à Valve e/ou aos
respectivos licenciantes. Este projeto é independente, comunitário e não é
afiliado, endossado ou patrocinado pela Valve. Gravações comunitárias
permanecem creditadas aos seus autores.
