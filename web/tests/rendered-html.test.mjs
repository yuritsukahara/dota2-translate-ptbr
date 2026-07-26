import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("portal público está em português e usa identidade Steam", async () => {
  const [page, layout, header, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/Header.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /DUBLAGEM BRASILEIRA DOTA 2/);
  assert.match(page, /Dota inteiro/);
  assert.match(layout, /<html lang="pt-BR">/);
  assert.match(header, /auth\/steam\/start/);
  assert.doesNotMatch(header, /Discord/);
  assert.match(header, /dota2_logo_symbol\.png/);
  assert.match(layout, /Dublagem Brasileira Dota 2/);
  assert.match(css, /--green:\s*#167447/i);
  assert.match(css, /--blue:\s*#1769aa/i);
  assert.match(css, /linear-gradient\(180deg,#ffffff,#f7faf8\)/i);
});

test("catálogo lista som local e captions oficiais EN e PT-BR", async () => {
  const [page, browser, audio] = await Promise.all([
    readFile(new URL("../app/heroes/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LineBrowser.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/OriginalAudio.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /getHeroLines/);
  assert.match(browser, /caption oficial/);
  assert.match(browser, /Sem versão PT-BR no catálogo/);
  assert.match(browser, /tradução automática/);
  assert.match(browser, /lines\.filter/);
  assert.match(audio, /Special:Redirect\/file/);
  assert.match(audio, /Fonte: Dota 2 Wiki\/Fandom/);
});

test("sugestões de captions ficam nas páginas de herói e exigem Steam", async () => {
  const [page, browser, api, terminology, legacy] = await Promise.all([
    readFile(new URL("../app/heroes/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LineBrowser.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/caption-suggestions/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../data/terminology.json", import.meta.url), "utf8"),
    readFile(new URL("../app/captions/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /LineBrowser/);
  assert.match(browser, /Sugerir alteração/);
  assert.match(browser, /suggestion-modal/);
  assert.match(browser, /api\/auth\/me/);
  assert.match(browser, /Entrar para sugerir/);
  assert.match(api, /validateTerminology/);
  assert.match(api, /assertSameOrigin/);
  assert.match(legacy, /redirect/);
  assert.doesNotMatch(legacy, /CaptionBrowser/);
  const glossary = JSON.parse(terminology);
  assert.equal(glossary.heroes.length, 127);
  assert.ok(glossary.items.length > 500);
});

test("narrador padrão possui página própria e catálogo oficial brasileiro", async () => {
  const [announcer, catalog, preview, page] = await Promise.all([
    readFile(new URL("../data/announcer-lines.json", import.meta.url), "utf8"),
    readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/community-preview.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/heroes/announcer/page.tsx", import.meta.url), "utf8"),
  ]);
  const data = JSON.parse(announcer);
  assert.ok(data.lines.length > 2_000);
  assert.ok(data.lines.filter((line) => line.captionPtBr).length > 1_300);
  assert.match(catalog, /Narrador padrão/);
  assert.match(catalog, /captionSources/);
  assert.match(preview, /translationMemory/);
  assert.match(preview, /getHeroLines\(heroId\)/);
  assert.match(page, /LineBrowser/);
  assert.match(page, /geradas automaticamente/);
});

test("traduções automáticas são separadas de captions oficiais e sugestões", async () => {
  const [resolver, browser, automatic] = await Promise.all([
    readFile(new URL("../lib/current-translations.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/LineBrowser.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/automatic-translations.ts", import.meta.url), "utf8"),
  ]);
  assert.match(resolver, /source: "official"/);
  assert.match(resolver, /source: "community"/);
  assert.match(resolver, /source: "automatic"/);
  assert.match(browser, /tradução automática/);
  assert.match(automatic, /automatic-translations\.json/);
});

test("tradução atual aparece nas páginas de herói e de fala", async () => {
  const [heroPage, linePage, resolver, catalog] = await Promise.all([
    readFile(new URL("../app/heroes/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/linhas/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/current-translations.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8"),
  ]);
  assert.match(heroPage, /getCurrentTranslations/);
  assert.match(heroPage, /captions PT-BR incluídas/);
  assert.match(linePage, /LEGENDA PT-BR INCLUÍDA/);
  assert.match(linePage, /getLineContext/);
  assert.match(resolver, /source: "official"/);
  assert.match(resolver, /source: "community"/);
  assert.match(resolver, /source: "automatic"/);
  assert.ok(resolver.indexOf('source: "official"') < resolver.indexOf('source: "community"'));
  assert.ok(resolver.indexOf('source: "community"') < resolver.indexOf('source: "automatic"'));
  assert.match(catalog, /linesByHero/);
});

test("inventário oficial cobre 127 heróis em ordem alfabética", async () => {
  const [catalogText, page, search, card] = await Promise.all([
    readFile(new URL("../data/heroes.json", import.meta.url), "utf8"),
    readFile(new URL("../app/heroes/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/HeroCatalog.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/HeroCard.tsx", import.meta.url), "utf8"),
  ]);
  const catalog = JSON.parse(catalogText);
  assert.equal(catalog.heroes.length, 127);
  assert.equal(new Set(catalog.heroes.map((hero) => hero.id)).size, 127);
  const names = catalog.heroes.map((hero) => hero.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "en")));
  const axe = catalog.heroes.find((hero) => hero.id === "axe");
  assert.equal(axe.total, 284);
  assert.equal(axe.officialEnglishCaptions, 284);
  assert.equal(axe.officialBrazilianCaptions, 0);
  assert.match(page, /captions geradas automaticamente/);
  assert.match(search, /Buscar herói pelo nome/);
  assert.match(card, /captions PT-BR incluídas/);
  assert.match(card, /sources\.automatic/);
});

test("inventário de voicelines mantém apenas referências locais ao áudio", async () => {
  const catalog = JSON.parse(await readFile(new URL("../data/voice-lines.json", import.meta.url), "utf8"));
  const all = Object.values(catalog.heroes).flat();
  assert.ok(all.length > 50_000);
  assert.equal(all.filter((line) => line.captionPtBr).length, 0);
  for (const line of all) {
    assert.match(line.assetPath, /^sounds\/vo\/[a-z0-9_]+\/[a-z0-9_]+\.vsnd_c$/);
    assert.equal(line.originalAudio, "dota_local");
    assert.ok(line.captionEn);
  }
});

test("packs de voz usam pasta do Google Drive e diretrizes obrigatórias", async () => {
  const [form, schema, api, drive, page, header] = await Promise.all([
    readFile(new URL("../components/VoicePackForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/voice-packs/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/google-drive.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/enviar/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/Header.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(form, /driveFolderUrl/);
  assert.match(form, /followedGuidelines/);
  assert.match(schema, /voice_pack_submissions/);
  assert.match(api, /normalizeGoogleDriveFolderUrl/);
  assert.match(api, /assertSameOrigin/);
  assert.match(drive, /drive\.google\.com/);
  assert.match(page, /Uma pasta\. Um herói\. Uma identidade\./);
  assert.match(header, /Packs de Voz/);
  assert.doesNotMatch(header, /Audições/);
  assert.doesNotMatch(header, /Instalar/);
});

test("petição possui assinatura única por usuário", async () => {
  const [page, schema, api, home, header] = await Promise.all([
    readFile(new URL("../app/peticao/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/petition/sign/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/Header.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Comunidade Dota 2 Brasil/);
  assert.match(page, /Valve, o Brasil quer ouvir Dota 2 em português/);
  assert.match(page, /projeto independente/);
  assert.match(home, /Dota inteiro/);
  assert.match(home, /Em português/);
  assert.doesNotMatch(home, /\baxe\b/i);
  assert.ok(header.indexOf("Heróis") < header.indexOf("Narrador"));
  assert.ok(header.indexOf("Narrador") < header.indexOf("Packs de Voz"));
  assert.ok(header.indexOf("Packs de Voz") < header.indexOf("Petição"));
  assert.doesNotMatch(header, />Traduções</);
  assert.doesNotMatch(header, /Moderação/);
  assert.match(schema, /petition_signatures/);
  assert.match(schema, /userId: text\("user_id"\)\.notNull\(\)\.unique\(\)/);
  assert.match(api, /assertSameOrigin/);
});
