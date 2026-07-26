# Portal Dota 2 Translate PT-BR

Portal público em Vinext/Cloudflare Workers para organizar tradução, gravação, votação e publicação das voicelines comunitárias.

O front-end usa Vite por meio do Vinext. O snapshot atual traz 127 heróis do OpenDota, imagens servidas pelo CDN indicado no catálogo e páginas dinâmicas para cada herói.

## Desenvolvimento

Requisitos: Node.js 22.13 ou superior.

```powershell
npm install
npm run db:generate
npm run dev
```

## Docker

Na raiz do repositório:

```powershell
docker compose up --build
```

O portal fica em `http://localhost:3000`. O container usa Wrangler para executar o bundle Cloudflare gerado pelo Vinext; isso mantém os módulos `cloudflare:*`, D1 e R2 compatíveis no Docker.

O ambiente local simula os bindings declarados em `.openai/hosting.json`:

- `DB`: Cloudflare D1 para catálogo, usuários, propostas, votos, revisões, releases e auditoria;
- `AUDIO`: Cloudflare R2 para uploads privados e gravações aprovadas.

Copie as chaves descritas em `.env.example` para o gerenciador de ambiente. Nunca versione o segredo Discord.

## Discord

Cadastre no Discord Developer Portal o callback:

```text
https://SEU-DOMINIO/api/auth/discord/callback
```

Defina `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` e, opcionalmente, `ADMIN_DISCORD_IDS`. O login usa state e PKCE, cookie HttpOnly/Secure/SameSite=Lax e recusa contas com menos de 30 dias.

## Fluxo editorial

Uma proposta fica elegível somente depois de sete dias, dez apoiadores únicos, liderança de três votos ou 20% e duas revisões independentes: linguística e técnica. Votos são consultivos; apenas moderadores ou administradores publicam o resultado.

Uploads são aceitos apenas como WAV PCM mono, 16-bit, 24/48 kHz, até 20 segundos e 10 MB. Entram em `pending/` no R2 e só migram para `approved/` após moderação.

## Inventário

O snapshot em `data/axe-lines.json` é exportado do CSV revisável do repositório:

```powershell
npm run web:seed
```

Ele contém 285 slots base do Axe, 284 legendas oficiais em inglês reconciliadas e um slot marcado como sem legenda oficial. O portal não hospeda áudio original da Valve.

## Verificação

```powershell
npm test
npx tsc --noEmit
npm run lint
```

As migrações D1 ficam em `drizzle/`. A publicação é feita pelo Sites a partir do commit Git exato.
