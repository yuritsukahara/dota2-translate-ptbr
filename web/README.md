# Portal Dota 2 Translate PT-BR

Portal Vinext/Cloudflare Workers para catalogar as voicelines oficiais, organizar audições comunitárias e demonstrar apoio a uma dublagem oficial em português brasileiro.

## O que é fonte oficial

- O inventário e as captions são extraídos do VPK instalado localmente.
- A interface só identifica uma tradução como oficial quando ela existe no arquivo brasileiro do mesmo build.
- No build catalogado atualmente, há 55.357 captions inglesas de 127 heróis e nenhuma caption brasileira base por herói.
- O portal guarda apenas o caminho do som original no cliente; não copia o áudio da Valve para R2.
- A categoria `Responses` da Dota 2 Wiki é uma referência editorial secundária, não a fonte canônica nem uma licença de redistribuição.

## Audições e packs

Cada candidato envia cinco WAVs para o mesmo roteiro. A comunidade pode votar, comentar, curtir ou desaprovar. Depois da triagem e revisão, um vencedor assume o herói inteiro. Um pack nunca mistura linhas de intérpretes diferentes.

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

## Desenvolvimento e Docker

Requisitos: Node.js 22.13 ou superior.

```powershell
npm install
npm run db:generate
npm run dev
```

Na raiz:

```powershell
docker compose up --build
```

O portal fica em `http://localhost:3000`. `DB` é o binding D1 e `AUDIO` é o R2 para gravações comunitárias pendentes e aprovadas.

## Verificação

```powershell
npm test
npm run lint
```

As migrações ficam em `drizzle/`. A publicação no Sites sempre parte do commit Git exato.
