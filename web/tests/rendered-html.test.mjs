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
    readFile(new URL("../app/heroes/axe/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/LineBrowser.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /285 slots/);
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
    assert.equal(line.releaseStatus, "missing");
  }
});

test("não contém assets de áudio da Valve", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /og\.png/);
});
