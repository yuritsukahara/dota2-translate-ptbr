# Dublagem Brasileira Dota 2

Portal pessoal em Vinext/Vite para catalogar captions, ouvir os arquivos do
Dota instalado e organizar packs comunitários em português brasileiro.

## O que é fonte oficial

- O inventário e as captions são extraídos do VPK instalado localmente.
- A interface só identifica uma tradução como oficial quando ela existe no arquivo brasileiro do mesmo build.
- No build catalogado atualmente, há 55.357 captions inglesas de 127 heróis e nenhuma caption brasileira base por herói.
- O portal guarda o caminho do som original e reproduz somente os MP3 extraídos do Dota instalado localmente.

## Captions

Cada página em `/heroes` concentra consulta e tradução. O usuário pesquisa por
texto ou ID e filtra por categoria. A prioridade visual é:
caption oficial PT-BR, sugestão comunitária, prévia automática do Codex e,
por fim, texto ainda sem tradução. A origem nunca é ocultada.

Usuários autenticados pela Steam podem abrir o modal de cada linha e sugerir
uma alternativa. O gerador usa o glossário oficial de heróis e itens e mantém
checkpoint local em `build/`.

## Packs de Voz

Cada intérprete envia um pack completo por meio de uma pasta própria do Google
Drive compartilhada como leitora. O portal guarda somente o link, crédito,
autoria e estado da revisão. Um pack nunca mistura linhas de intérpretes diferentes.

Formato: WAV PCM mono, 16-bit, 24/48 kHz, até 20 segundos e 10 MB por arquivo. O autor declara consentimento, crédito e licença CC BY 4.0.

## Login Steam

O login usa o provedor OpenID da Steam. Configure:

```dotenv
STEAM_WEB_API_KEY=
ADMIN_STEAM_IDS=
PUBLIC_SITE_URL=http://localhost:3000
```

O OpenID funciona sem segredo. A chave Web API é opcional e permite obter nome/avatar públicos e verificar que a conta possui pelo menos 30 dias. Nunca versione a chave.

## Petição

`/peticao` apresenta uma carta pública à Valve e aceita uma assinatura por Steam ID. A ação exige sessão, validação de origem, limite de uso e registro de auditoria. A página não afirma apoio da Valve nem entrega automática da petição.

## Desenvolvimento local

Requisitos: Node.js 22.13 ou superior.

```powershell
npm install
npm run db:generate
npm run dev
```

O portal fica em `http://localhost:3000`. O ambiente de desenvolvimento cria
as dependências de dados localmente; não é necessário Docker.

Os players procuram os arquivos em `../build/local-audio/mp3`. Para extrair ou
atualizar o narrador padrão, execute na raiz:

```powershell
npm run audio:catalog -- --hero announcer --merge
```

`build/local-audio` fica fora do Git e deve permanecer para uso pessoal.

## Verificação

```powershell
npm test
npm run lint
```

As migrações ficam em `drizzle/`.
