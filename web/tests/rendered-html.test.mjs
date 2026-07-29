import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const file = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("portal Vite usa identidade Steam e mantém somente a navegação atual", async () => {
  const [html, app, header, footer, home, css, analytics, packageText] = await Promise.all([
    file("index.html"),
    file("src/App.tsx"),
    file("components/Header.tsx"),
    file("components/Footer.tsx"),
    file("app/page.tsx"),
    file("app/globals.css"),
    file("components/GoogleAnalytics.tsx"),
    file("package.json"),
  ]);
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /favicon\.svg/);
  assert.doesNotMatch(html, /og\.png/);
  assert.match(header, /api\/auth\/steam\/start/);
  assert.match(header, /href="\/heroes"/);
  assert.match(header, /href="\/personas"/);
  assert.match(header, /href="\/announcer"/);
  assert.match(header, /href="\/enviar"/);
  assert.match(header, /href="\/peticao"/);
  assert.match(header, /href="\/releases"/);
  assert.match(footer, /tangoleague-logo-text-black\.png/);
  assert.match(footer, /unoptimized/);
  assert.doesNotMatch(home, /\baxe\b/i);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /\.hero-card-grid,\s*\.stats-grid/);
  assert.match(css, /\.line-row \{ grid-template-columns: 1fr auto; \}/);
  assert.match(css, /\.mobile-nav \{ display: block; \}/);
  assert.match(app, /<GoogleAnalytics/);
  assert.match(analytics, /page_view/);
  assert.match(analytics, /isLocalHost/);
  assert.doesNotMatch(analytics, /user_id/);
  assert.match(app, /G-XJESRK7NV7/);
  assert.match(packageText, /"build": "vite build"/);
  assert.doesNotMatch(packageText, /vinext|next/);
});

test("página de release explica opções, camada de idioma e download", async () => {
  const [app, page, release, css] = await Promise.all([
    file("src/App.tsx"),
    file("app/releases/page.tsx"),
    file("data/installer-release.json"),
    file("app/globals.css"),
  ]);
  const manifest = JSON.parse(release);
  assert.match(app, /pathname === "\/releases"/);
  assert.match(page, /Somente legendas/);
  assert.match(page, /Legendas \+ Axe/);
  assert.match(page, /camada de idioma/);
  assert.match(page, /não altera mecânicas/i);
  assert.match(page, /backup\s+antes\s+de\s+começar/i);
  assert.match(page, /opções de inicialização do Dota\s+não são alteradas/i);
  assert.doesNotMatch(page, /-language brazilian|Steam pode reiniciar/i);
  assert.match(page, /DublagemBrasileiraDota2\.exe/);
  assert.equal(manifest.captions.tokens, 77_594);
  assert.equal(
    manifest.captions.sources.official +
      manifest.captions.sources.community +
      manifest.captions.sources.suggested,
    manifest.captions.tokens,
  );
  assert.equal(manifest.voicePacks[0].lines, 243);
  assert.match(css, /\.release-mode-grid/);
});

test("catálogo fixado ao build 6869 possui os totais esperados", async () => {
  const [heroesText, voicesText, personasText, announcerText, suggestedText] =
    await Promise.all([
      file("data/heroes.json"),
      file("data/voice-lines.json"),
      file("data/personas.json"),
      file("data/announcer-lines.json"),
      file("data/automatic-translations.json"),
    ]);
  const heroes = JSON.parse(heroesText);
  const voices = JSON.parse(voicesText);
  const personas = JSON.parse(personasText);
  const announcer = JSON.parse(announcerText);
  const suggested = JSON.parse(suggestedText);
  const baseLines = Object.values(voices.heroes).flat();
  const personaLines = personas.variants.flatMap((variant) => variant.lines);

  assert.equal(String(heroes.build.clientVersion), "6869");
  assert.equal(heroes.heroes.length, 127);
  assert.equal(baseLines.length, 46_871);
  assert.equal(personas.variants.length, 41);
  assert.equal(personaLines.length, 28_649);
  assert.equal(announcer.lines.length, 2_074);
  assert.equal(baseLines.length + personaLines.length + announcer.lines.length, 77_594);
  assert.equal(
    announcer.lines.filter(
      (line) =>
        line.captionPtBrSource === "official" && line.captionPtBr,
    ).length,
    1_399,
  );
  assert.equal(suggested.metadata.translatedOccurrences, 71_348);
  assert.equal(
    [...baseLines, ...personaLines, ...announcer.lines].filter(
      (line) => !line.captionPtBr,
    ).length,
    0,
  );
  assert.equal(
    voices.heroes.axe.filter(
      (line) => line.captionPtBrSource === "community" && line.captionPtBr,
    ).length,
    243,
  );
  assert.ok(baseLines.every((line) => !("releaseStatus" in line)));
});

test("heróis, personas e narrador compartilham catálogo pesquisável", async () => {
  const [heroesPage, heroPage, personasPage, personaPage, announcerPage, card, browser] =
    await Promise.all([
      file("app/heroes/page.tsx"),
      file("app/heroes/[id]/page.tsx"),
      file("app/personas/page.tsx"),
      file("app/personas/[id]/page.tsx"),
      file("app/announcer/page.tsx"),
      file("components/HeroCard.tsx"),
      file("components/LineBrowser.tsx"),
    ]);
  assert.match(heroesPage, /HeroCatalog/);
  assert.match(heroPage, /getHeroLines/);
  assert.match(personasPage, /<HeroCard/);
  assert.match(personaPage, /getPersonaLines/);
  assert.match(announcerPage, /LineBrowser/);
  assert.match(card, /"BASE"/);
  assert.match(card, /"PERSONA"/);
  assert.match(card, /"VARIANTE DE VOZ"/);
  assert.match(browser, /@legendapp\/list\/react/);
  assert.match(browser, /Buscar por ID ou contexto/);
  assert.match(browser, /EN · caption oficial/);
  assert.match(browser, /PT-BR ·/);
  assert.match(browser, /Sugerir alteração/);
  assert.doesNotMatch(
    [heroesPage, heroPage, personasPage, personaPage, announcerPage, card, browser].join("\n"),
    /automátic/i,
  );
});

test("schema limpo contém somente as seis tabelas do produto", async () => {
  const [schema, migration, env, config] = await Promise.all([
    file("db/schema.ts"),
    file("drizzle/0000_nappy_franklin_storm.sql"),
    file(".env.example"),
    file("wrangler.jsonc"),
  ]);
  const created = [...migration.matchAll(/CREATE TABLE `([^`]+)`/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(created.sort(), [
    "audit_events",
    "caption_suggestions",
    "petition_signatures",
    "sessions",
    "users",
    "voice_pack_submissions",
  ]);
  assert.match(schema, /steamId: text\("steam_id"\)/);
  assert.match(schema, /steamAccountCreatedAt: text\("steam_account_created_at"\)/);
  assert.doesNotMatch(schema, /displayPublicly|verified|roles|proposals|votes|audioClips/);
  assert.doesNotMatch(migration, /discord|display_publicly|verified/i);
  assert.doesNotMatch(env, /ADMIN_/);
  assert.match(config, /"binding": "MEDIA"/);
  assert.match(config, /"binding": "SUBMISSIONS"/);
  assert.doesNotMatch(config, /"binding": "AUDIO"/);
});

test("as três ações protegidas exigem sessão e retorno Steam seguro", async () => {
  const [petition, captions, packs, start, callback, openid, auth, lineBrowser] =
    await Promise.all([
      file("app/api/petition/sign/route.ts"),
      file("app/api/caption-suggestions/route.ts"),
      file("app/api/voice-packs/route.ts"),
      file("app/api/auth/steam/start/route.ts"),
      file("app/api/auth/steam/callback/route.ts"),
      file("lib/steam-openid.ts"),
      file("lib/auth.ts"),
      file("components/LineBrowser.tsx"),
    ]);
  for (const route of [petition, captions, packs]) {
    assert.match(route, /assertSameOrigin/);
    assert.match(route, /requireUser/);
    assert.match(route, /assertRateLimit/);
  }
  assert.match(auth, /status: 401/);
  assert.match(start, /dt_steam_return_to/);
  assert.match(callback, /dt_steam_return_to/);
  assert.match(callback, /savedUser\.id/);
  assert.match(openid, /safeReturnPath/);
  assert.ok(openid.includes('startsWith("//")'));
  assert.ok(openid.includes('startsWith("/api/auth/")'));
  assert.match(captions, /db\.batch\(\[/);
  assert.match(captions, /db\.insert\(captionSuggestions\)/);
  assert.match(captions, /db\.insert\(auditEvents\)/);
  assert.match(captions, /status: 201/);
  assert.match(lineBrowser, /fetch\("\/api\/caption-suggestions"/);
  assert.match(lineBrowser, /Sugestão enviada para a comunidade\./);
});

test("petição consulta a API, publica perfil Steam e impede assinatura duplicada", async () => {
  const [page, content, button, schema, api, query] = await Promise.all([
    file("app/peticao/page.tsx"),
    file("components/PetitionPageContent.tsx"),
    file("components/PetitionButton.tsx"),
    file("db/schema.ts"),
    file("app/api/petition/sign/route.ts"),
    file("app/api/petition/route.ts"),
  ]);
  assert.match(page, /PetitionPageContent/);
  assert.match(query, /avatar/);
  assert.match(content, /nome e avatar públicos da Steam aparecem nesta lista/);
  assert.match(content, /fetch\("\/api\/petition"/);
  assert.match(button, /Obrigado por assinar!/);
  assert.match(button, /alreadySigned \|\| signedLocally/);
  assert.match(button, /onSigned/);
  assert.match(query, /currentUser\(request\)/);
  assert.match(schema, /userId: text\("user_id"\)\.notNull\(\)\.unique\(\)/);
  assert.match(api, /onConflictDoNothing/);
  assert.doesNotMatch([page, content, button, schema, api].join("\n"), /displayPublicly/);
});

test("packs usam Google Drive, perfil Steam e kits R2 com 284 falas verbais do Axe", async () => {
  const [voicesText, personasText, variantIdsText, submitPage, form, packPage, route, drive, template, profile, profileApi, worker] = await Promise.all([
    file("data/voice-lines.json"),
    file("data/personas.json"),
    file("data/voice-pack-variant-ids.json"),
    file("app/enviar/page.tsx"),
    file("components/VoicePackForm.tsx"),
    file("app/packs/[hero]/page.tsx"),
    file("app/api/voice-packs/route.ts"),
    file("lib/google-drive.ts"),
    file("../scripts/build-r2-media.mjs"),
    file("app/perfil/[id]/page.tsx"),
    file("app/api/profiles/[id]/route.ts"),
    file("worker/index.ts"),
  ]);
  const axe = JSON.parse(voicesText).heroes.axe;
  const variants = JSON.parse(personasText).variants;
  const variantIds = JSON.parse(variantIdsText);
  const required = axe.filter(
    (line) =>
      line.captionEn &&
      line.voiceScope !== "excluded_nonverbal" &&
      line.voiceScope !== "excluded_no_official_caption",
  );
  assert.equal(required.length, 284);
  assert.equal(variants.length, 41);
  assert.deepEqual(variantIds, variants.map((variant) => variant.id));
  assert.match(submitPage, /personas\.map/);
  assert.match(submitPage, /Variante de voz/);
  assert.match(form, /driveFolderUrl/);
  assert.match(form, /followedGuidelines/);
  assert.match(packPage, /Baixar pasta preparada/);
  assert.match(packPage, /api\/voice-pack-template\/\$\{source\.id\}/);
  assert.match(route, /normalizeGoogleDriveFolderUrl/);
  assert.match(route, /voicePackVariantIds\.includes/);
  assert.match(drive, /drive\.google\.com/);
  assert.match(template, /README\.txt/);
  assert.match(template, /CHECKLIST\.txt/);
  assert.match(template, /\[ \] \$\{line\.id\}/);
  assert.match(template, /personas\.variants\.map/);
  assert.match(profile, /api\/profiles/);
  assert.match(profileApi, /voicePackSubmissions/);
  assert.match(route, /runtimeEnv\.SUBMISSIONS\.put/);
  assert.match(worker, /env\.MEDIA\.get/);
  assert.match(worker, /audio\/build-6869\/indexes/);
  assert.match(worker, /accept-ranges/);
  assert.match(worker, /content-range/);
  assert.doesNotMatch(profile, /voicePacks|audioClips/);
});

test("rotas e componentes removidos não voltaram", async () => {
  const removed = [
    "app/captions/page.tsx",
    "app/linhas/[id]/page.tsx",
    "app/moderacao/page.tsx",
    "app/heroes/announcer/page.tsx",
    "app/api/proposals/route.ts",
    "app/api/releases/route.ts",
    "app/api/uploads/audio/route.ts",
    "components/AudioUploadForm.tsx",
    "components/ProposalForm.tsx",
    "lib/wav.ts",
  ];
  for (const relativePath of removed) {
    await assert.rejects(access(new URL(`../${relativePath}`, import.meta.url)), {
      code: "ENOENT",
    });
  }
});
