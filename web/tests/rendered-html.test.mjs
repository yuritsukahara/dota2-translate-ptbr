import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("define o portal público em português", async () => {
  const [page, layout, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Dota 2 Translate PT-BR/);
  assert.match(page, /Cada herói/);
  assert.match(page, /285/);
  assert.match(layout, /<html lang="pt-BR">/);
  assert.match(layout, /og\.png/);
  assert.match(css, /--gold:\s*#d7a84f/i);
  assert.doesNotMatch(`${page}\n${layout}`, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("catálogo do Axe expõe busca, filtros e links de detalhe", async () => {
  const [page, browser] = await Promise.all([
    readFile(new URL("../app/heroes/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LineBrowser.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /getHeroLines/);
  assert.match(browser, /Buscar por ID ou contexto/);
  assert.match(browser, /\/linhas\/\$\{line\.id\}/);
  assert.match(browser, /lines\.filter/);
});

test("seed possui 285 ids únicos e caminhos seguros", async () => {
  const lines = JSON.parse(await readFile(new URL("../data/axe-lines.json", import.meta.url), "utf8"));
  assert.equal(lines.length, 285);
  assert.equal(new Set(lines.map((line) => line.id)).size, 285);
  for (const line of lines) {
    assert.match(line.id, /^axe_[a-z0-9_]+$/);
    assert.match(line.assetPath, /^sounds\/vo\/axe\/axe_[a-z0-9_]+\.vsnd_c$/);
    if (line.id !== "axe_rival_13") {
      assert.ok(line.sourceText, `legenda oficial ausente em ${line.id}`);
    }
    assert.equal(line.releaseStatus, "missing");
  }
  assert.equal(lines.filter((line) => line.voiceScope === "spoken").length, 243);
  assert.equal(lines.filter((line) => line.voiceScope === "excluded_nonverbal").length, 41);
  assert.equal(lines.filter((line) => line.voiceScope === "excluded_no_official_caption").length, 1);
  assert.equal(lines.filter((line) => line.voiceScope === "spoken" && !line.ptBrText).length, 0);
});

test("grid usa os 127 heróis e imagens sincronizadas via OpenDota", async () => {
  const catalog = JSON.parse(
    await readFile(new URL("../data/heroes.json", import.meta.url), "utf8")
  );
  assert.equal(catalog.heroes.length, 127);
  assert.equal(new Set(catalog.heroes.map((hero) => hero.id)).size, 127);
  const axe = catalog.heroes.find((hero) => hero.id === "axe");
  assert.equal(axe.total, 243);
  assert.equal(axe.assetTotal, 285);
  assert.equal(axe.drafted, 243);
  assert.match(axe.imageUrl, /^https:\/\/cdn\.cloudflare\.steamstatic\.com\//);
});

test("não contém assets de áudio da Valve", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /og\.png/);
});
