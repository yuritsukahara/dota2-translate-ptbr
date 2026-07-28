import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const file = (relativePath) =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("portal usa identidade Steam e mantém somente a navegação atual", async () => {
  const [layout, header, footer, home, css] = await Promise.all([
    file("app/layout.tsx"),
    file("components/Header.tsx"),
    file("components/Footer.tsx"),
    file("app/page.tsx"),
    file("app/globals.css"),
  ]);
  assert.match(layout, /<html lang="pt-BR">/);
  assert.match(layout, /favicon\.svg/);
  assert.doesNotMatch(layout, /og\.png/);
  assert.match(header, /api\/auth\/steam\/start/);
  assert.match(header, /href="\/heroes"/);
  assert.match(header, /href="\/personas"/);
  assert.match(header, /href="\/announcer"/);
  assert.match(header, /href="\/enviar"/);
  assert.match(header, /href="\/peticao"/);
  assert.match(footer, /tangoleague-logo-text-black\.png/);
  assert.match(footer, /unoptimized/);
  assert.doesNotMatch(home, /\baxe\b/i);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /\.hero-card-grid,\s*\.stats-grid/);
  assert.match(css, /\.line-row \{ grid-template-columns: 1fr auto; \}/);
  assert.match(css, /\.mobile-nav \{ display: block; \}/);
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
  assert.equal(baseLines.length, 55_357);
  assert.equal(personas.variants.length, 39);
  assert.equal(personaLines.length, 19_878);
  assert.equal(announcer.lines.length, 2_074);
  assert.equal(baseLines.length + personaLines.length + announcer.lines.length, 77_309);
  assert.equal(announcer.lines.filter((line) => line.captionPtBr).length, 1_399);
  assert.equal(suggested.metadata.translatedOccurrences, 71_306);
  assert.equal(
    baseLines.filter(
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
  assert.doesNotMatch(config, /r2_buckets|AUDIO/);
});

test("as três ações protegidas exigem sessão e retorno Steam seguro", async () => {
  const [petition, captions, packs, start, callback, openid, auth] =
    await Promise.all([
      file("app/api/petition/sign/route.ts"),
      file("app/api/caption-suggestions/route.ts"),
      file("app/api/voice-packs/route.ts"),
      file("app/api/auth/steam/start/route.ts"),
      file("app/api/auth/steam/callback/route.ts"),
      file("lib/steam-openid.ts"),
      file("lib/auth.ts"),
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
});

test("petição publica nome e avatar Steam e impede assinatura duplicada", async () => {
  const [page, content, button, schema, api] = await Promise.all([
    file("app/peticao/page.tsx"),
    file("components/PetitionPageContent.tsx"),
    file("components/PetitionButton.tsx"),
    file("db/schema.ts"),
    file("app/api/petition/sign/route.ts"),
  ]);
  assert.match(page, /avatarUrl/);
  assert.match(content, /nome e avatar públicos da Steam aparecem nesta lista/);
  assert.match(button, /Obrigado por assinar!/);
  assert.match(button, /router\.refresh\(\)/);
  assert.match(schema, /userId: text\("user_id"\)\.notNull\(\)\.unique\(\)/);
  assert.match(api, /onConflictDoNothing/);
  assert.doesNotMatch([page, content, button, schema, api].join("\n"), /displayPublicly/);
});

test("packs usam Google Drive, perfil Steam e kit Axe com 243 falas", async () => {
  const [voicesText, form, route, drive, template, profile] = await Promise.all([
    file("data/voice-lines.json"),
    file("components/VoicePackForm.tsx"),
    file("app/api/voice-packs/route.ts"),
    file("lib/google-drive.ts"),
    file("lib/voice-pack-template.ts"),
    file("app/perfil/[id]/page.tsx"),
  ]);
  const axe = JSON.parse(voicesText).heroes.axe;
  const required = axe.filter(
    (line) =>
      line.captionEn &&
      line.voiceScope !== "excluded_nonverbal" &&
      line.voiceScope !== "excluded_no_official_caption",
  );
  assert.equal(required.length, 243);
  assert.match(form, /driveFolderUrl/);
  assert.match(form, /followedGuidelines/);
  assert.match(route, /normalizeGoogleDriveFolderUrl/);
  assert.match(drive, /drive\.google\.com/);
  assert.match(template, /README\.txt/);
  assert.match(template, /CHECKLIST\.txt/);
  assert.match(template, /\[ \] \$\{line\.id\}/);
  assert.match(profile, /voicePackSubmissions/);
  assert.doesNotMatch(profile, /voicePacks|audioClips/);
});

test("rotas e componentes removidos não voltaram", async () => {
  const removed = [
    "app/captions/page.tsx",
    "app/linhas/[id]/page.tsx",
    "app/moderacao/page.tsx",
    "app/releases/page.tsx",
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
