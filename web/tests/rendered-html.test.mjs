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
  assert.match(page, /DOTA 2 TRANSLATE PT-BR/);
  assert.match(page, /Dota inteiro/);
  assert.match(layout, /<html lang="pt-BR">/);
  assert.match(header, /auth\/steam\/start/);
  assert.doesNotMatch(header, /Discord/);
  assert.match(css, /--gold:\s*#d7a84f/i);
});

test("catálogo lista som local e captions oficiais EN e PT-BR", async () => {
  const [page, browser, audio] = await Promise.all([
    readFile(new URL("../app/heroes/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LineBrowser.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/OriginalAudio.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /getHeroLines/);
  assert.match(browser, /caption oficial/);
  assert.match(browser, /Tradução ainda em geração/);
  assert.match(browser, /tradução automática/);
  assert.match(browser, /lines\.filter/);
  assert.match(audio, /Special:Redirect\/file/);
  assert.match(audio, /Fonte: Dota 2 Wiki\/Fandom/);
});

test("página de captions separa inglês oficial e tradução comunitária", async () => {
  const [page, browser, api, terminology] = await Promise.all([
    readFile(new URL("../app/captions/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/CaptionBrowser.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/caption-suggestions/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../data/terminology.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Tradução das captions/);
  assert.match(page, /Escolha o herói/);
  assert.match(browser, /Inglês oficial/);
  assert.match(browser, /Português brasileiro/);
  assert.match(browser, /caption-inline-editor/);
  assert.match(browser, /Sugestões e votos/);
  assert.match(api, /validateTerminology/);
  assert.match(api, /assertSameOrigin/);
  const glossary = JSON.parse(terminology);
  assert.equal(glossary.heroes.length, 127);
  assert.ok(glossary.items.length > 500);
});

test("narrador padrão possui catálogo oficial brasileiro e todos os heróis aceitam prévias", async () => {
  const [announcer, catalog, preview] = await Promise.all([
    readFile(new URL("../data/announcer-lines.json", import.meta.url), "utf8"),
    readFile(new URL("../lib/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/community-preview.ts", import.meta.url), "utf8"),
  ]);
  const data = JSON.parse(announcer);
  assert.ok(data.lines.length > 2_000);
  assert.ok(data.lines.filter((line) => line.captionPtBr).length > 1_300);
  assert.match(catalog, /Narrador padrão/);
  assert.match(catalog, /captionSources/);
  assert.match(preview, /translationMemory/);
  assert.match(preview, /getHeroLines\(heroId\)/);
});

test("traduções automáticas são separadas de captions oficiais e sugestões", async () => {
  const [page, browser, automatic] = await Promise.all([
    readFile(new URL("../app/captions/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/CaptionBrowser.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/automatic-translations.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Codex são incluídas diretamente/);
  assert.match(page, /Não há votação para confirmar a inclusão/);
  assert.match(browser, /AUTOMÁTICA · NÃO REVISADA/);
  assert.match(browser, /inline-source-label automatic/);
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
  assert.match(heroPage, /traduções PT-BR incluídas/);
  assert.match(linePage, /LEGENDA PT-BR INCLUÍDA/);
  assert.match(linePage, /getLineContext/);
  assert.match(resolver, /source: "automatic"/);
  assert.match(catalog, /linesByHero/);
});

test("inventário oficial cobre 127 heróis em ordem alfabética", async () => {
  const catalog = JSON.parse(await readFile(new URL("../data/heroes.json", import.meta.url), "utf8"));
  assert.equal(catalog.heroes.length, 127);
  assert.equal(new Set(catalog.heroes.map((hero) => hero.id)).size, 127);
  const names = catalog.heroes.map((hero) => hero.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "en")));
  const axe = catalog.heroes.find((hero) => hero.id === "axe");
  assert.equal(axe.total, 284);
  assert.equal(axe.officialEnglishCaptions, 284);
  assert.equal(axe.officialBrazilianCaptions, 0);
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

test("audição exige cinco linhas e pack indivisível", async () => {
  const [form, schema] = await Promise.all([
    readFile(new URL("../components/AuditionForm.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
  ]);
  assert.match(form, /lines\.length !== 5/);
  assert.match(schema, /voice_packs/);
  assert.match(schema, /heroId: text\("hero_id"\)\.notNull\(\)\.unique\(\)/);
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
  assert.doesNotMatch(home, /Captions do Axe/);
  assert.ok(header.indexOf("Heróis") < header.indexOf("Traduções"));
  assert.ok(header.indexOf("Traduções") < header.indexOf("Petição"));
  assert.match(schema, /petition_signatures/);
  assert.match(schema, /userId: text\("user_id"\)\.notNull\(\)\.unique\(\)/);
  assert.match(api, /assertSameOrigin/);
});
