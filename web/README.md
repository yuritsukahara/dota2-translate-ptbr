# Portal Vinext

Aplicação local em Vinext/Vite com catálogo estático e persistência D1 para
identidade Steam e contribuições.

## Requisitos

- Node.js 22.13 ou superior;
- dependências instaladas com `npm install`;
- `PUBLIC_SITE_URL` igual à origem usada no navegador.

Variáveis opcionais em `.env.local`:

```dotenv
PUBLIC_SITE_URL=http://localhost:3000
STEAM_WEB_API_KEY=
```

Steam OpenID confirma a identidade sem segredo. A Web API key melhora a leitura
do nome, avatar e data de criação do perfil. Nunca versione a chave.

## Banco D1 local

O baseline em `drizzle/` cria somente `users`, `sessions`,
`petition_signatures`, `caption_suggestions`, `voice_pack_submissions` e
`audit_events`.

```powershell
npm run db:generate
npm run db:migrate:local
```

O estado local fica em `.wrangler/` e não é versionado.

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
