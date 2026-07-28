# Portal Vite

SPA React criada com Vite e servida como assets estáticos pela Cloudflare.
Somente `/api/*` executa o Worker; D1 guarda identidade e contribuições, enquanto
R2 guarda kits públicos e espelhos privados de envios.

## Requisitos

- Node.js 22.13 ou superior;
- dependências instaladas com `npm install`;
- `PUBLIC_SITE_URL` igual à origem usada no navegador.

Variáveis opcionais em `.env.local`:

```dotenv
PUBLIC_SITE_URL=http://localhost:3000
STEAM_WEB_API_KEY=
VITE_GA_MEASUREMENT_ID=
```

Steam OpenID confirma a identidade sem segredo. A Web API key melhora a leitura
do nome, avatar e data de criação do perfil. Nunca versione a chave.
O GA4 fica desligado no localhost mesmo quando o ID existe. Em produção, o
frontend usa o fluxo `tango-ga4` (`G-XJESRK7NV7`) e registra pageviews
iniciais e navegações internas, sem associar a identidade Steam ao Analytics.

## Banco D1 local

O baseline em `drizzle/` cria somente `users`, `sessions`,
`petition_signatures`, `caption_suggestions`, `voice_pack_submissions` e
`audit_events`.

```powershell
npm run db:generate
npm run db:migrate:local
```

O estado local fica em `.wrangler/` e não é versionado.

## R2

- `dublagem-brasileira-media`: kits ZIP e manifests públicos;
- `dublagem-brasileira-submissions`: espelho privado dos envios;
- `media.traducao.tangoleague.gg`: domínio público do primeiro bucket.

Gere os 127 kits a partir do catálogo com `npm --prefix .. run r2:build`.

## Executar e verificar

```powershell
npm run dev
npm run lint
npm test
```

O portal fica em `http://localhost:3000`. Os players procuram os MP3 em
`../build/local-audio/mp3`; a leitura do catálogo e o download dos kits ZIP
continuam públicos. Petição, sugestão de caption e envio de pack exigem uma
sessão Steam.

Para extrair ou acrescentar o narrador ao catálogo local:

```powershell
npm run audio:catalog -- --hero announcer --merge
```

## Publicar na Cloudflare

O `wrangler.jsonc` aponta os bindings `DB`, `MEDIA` e `SUBMISSIONS` para os
recursos de produção e publica o Worker em `dublagem.tangoleague.gg`. O ID do D1
e o account ID não são segredos; a chave da Steam deve existir somente como
secret da Cloudflare.

Na primeira publicação:

```powershell
npx wrangler login
npm run db:migrate:remote
npx wrangler secret put STEAM_WEB_API_KEY
npm run deploy
```

Nas próximas versões, rode apenas `npm run deploy` quando não houver migração.
Se houver uma nova migração, aplique `npm run db:migrate:remote` antes do
deploy. O comando gera o SPA com Vite, compila o Worker de API e publica os
assets estáticos. Requisições comuns não executam o Worker; `/api/*` executa.

Depois da publicação, confirme:

```powershell
Invoke-WebRequest https://dublagem.tangoleague.gg/
npx wrangler deployments status
npx wrangler d1 execute DB --remote --command "SELECT COUNT(*) AS users FROM users"
```
