import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { listVpkEntries, readVpkEntryRecord } from "./lib/vpk.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultVpk =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta\\game\\dota\\pak01_dir.vpk";
const voiceCatalogPath = path.join(root, "web", "data", "voice-lines.json");
const heroCatalogPath = path.join(root, "web", "data", "heroes.json");
const announcerCatalogPath = path.join(root, "web", "data", "announcer-lines.json");
const knownNonVerbalIds = new Set([
  "no_mana_not_yet01",
  "no_mana_not_yet02",
  "no_mana_not_yet03",
  "marci_deny",
  "marci_immortality",
  "marci_laugh",
  "marci_move",
  "marci_move_2",
  "marci_move_3",
  "marci_sad",
  "marci_surprised",
  "marci_taking_damage",
  "marci_thanks",
]);

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function has(name) {
  return process.argv.includes(name);
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function normalizeAnnouncerAssetPath(assetPath) {
  const directory = path.posix.dirname(assetPath);
  const filename = path.posix.basename(assetPath);
  const folder = path.posix.basename(directory);
  const redundantPrefix = `${folder}_`;
  return filename.startsWith(redundantPrefix)
    ? `${directory}/${filename.slice(redundantPrefix.length)}`
    : assetPath;
}

function extractEmbeddedMp3(resource, id) {
  if (resource.length < 8) throw new Error(`${id}: recurso muito pequeno`);
  const audioOffset = resource.readUInt32LE(0);
  if (audioOffset < 16 || audioOffset >= resource.length - 4) {
    throw new Error(`${id}: offset de áudio inválido (${audioOffset})`);
  }
  const audio = resource.subarray(audioOffset);
  const isMpegFrame =
    audio[0] === 0xff &&
    (audio[1] & 0xe0) === 0xe0 &&
    (audio[1] & 0x18) !== 0x08;
  if (!isMpegFrame && audio.subarray(0, 3).toString("ascii") !== "ID3") {
    throw new Error(`${id}: fluxo embutido não é MP3`);
  }
  return audio;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit > 1 ? 2 : 0)} ${units[unit]}`;
}

function renderHtml(catalog) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Catálogo local de voicelines · Dota 2 Translate PT-BR</title>
<style>
:root{color-scheme:dark;--bg:#0b0a09;--panel:#15120f;--paper:#eee5d4;--muted:#948978;--line:#393129;--gold:#d7a84f;--red:#cf3e2e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--paper);font:15px/1.5 system-ui,sans-serif}
header{position:sticky;top:0;z-index:2;background:#0b0a09ee;border-bottom:1px solid var(--line);padding:22px max(20px,calc((100% - 1240px)/2))}
h1{margin:0;text-transform:uppercase;letter-spacing:-.04em}header p{margin:5px 0 16px;color:var(--muted)}
.controls{display:grid;grid-template-columns:1fr 260px;gap:10px}.controls input,.controls select{background:var(--panel);border:1px solid var(--line);color:var(--paper);padding:12px}
main{width:min(1240px,calc(100% - 40px));margin:24px auto}.summary{color:var(--gold);font-weight:700;margin-bottom:16px}
.line{display:grid;grid-template-columns:220px 260px 1fr 1fr;gap:18px;border:1px solid var(--line);border-bottom:0;padding:16px;background:var(--panel);align-items:center}.line:last-child{border-bottom:1px solid var(--line)}
code{overflow-wrap:anywhere;color:var(--gold)}small{display:block;color:var(--muted)}audio{width:100%;height:34px}.missing{color:var(--muted);font-style:italic}.hero{font-weight:800;text-transform:uppercase}
@media(max-width:850px){.controls,.line{grid-template-columns:1fr}.line{gap:10px}}
</style>
</head>
<body>
<header><h1>Catálogo local de voicelines</h1><p>MP3 extraído do Dota instalado · build ${catalog.build.clientVersion} · não publicar esta pasta</p>
<div class="controls"><input id="q" placeholder="Buscar herói, ID ou caption…"><select id="hero"><option value="">Todos os heróis extraídos</option></select></div></header>
<main><div class="summary" id="summary"></div><div id="list"></div></main>
<script id="data" type="application/json">${safeJson(catalog)}</script>
<script>
const catalog=JSON.parse(document.querySelector("#data").textContent);
const q=document.querySelector("#q"), hero=document.querySelector("#hero"), list=document.querySelector("#list"), summary=document.querySelector("#summary");
for(const item of [...new Set(catalog.lines.map(x=>x.heroName))].sort((a,b)=>a.localeCompare(b))){const o=document.createElement("option");o.value=item;o.textContent=item;hero.append(o)}
if([...hero.options].some(option=>option.value==="Axe"))hero.value="Axe";
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){const query=q.value.trim().toLowerCase();const rows=catalog.lines.filter(x=>(!hero.value||x.heroName===hero.value)&&(!query||[x.heroName,x.id,x.captionEn,x.captionPtBr,x.category].some(v=>String(v??"").toLowerCase().includes(query))));const visible=rows.slice(0,500);summary.textContent=rows.length+" resultados · exibindo "+visible.length+" · "+catalog.lines.length+" MP3s no catálogo";list.innerHTML=visible.map(x=>\`<article class="line"><div><span class="hero">\${esc(x.heroName)}</span><code>\${esc(x.id)}</code><small>\${esc(x.category)}</small></div><audio controls preload="none" src="\${encodeURI(x.mp3)}"></audio><div><small>EN oficial</small>\${esc(x.captionEn)}</div><div class="\${x.captionPtBr?"":"missing"}"><small>PT-BR oficial</small>\${esc(x.captionPtBr||"Não publicada neste build")}</div></article>\`).join("")}
q.addEventListener("input",render);hero.addEventListener("change",render);render();
</script>
</body></html>`;
}

const vpkPath = path.resolve(argument("--vpk", defaultVpk));
const outputRoot = path.resolve(argument("--output", path.join(root, "build", "local-audio")));
const requestedHero = argument("--hero", "axe");
const extractAll = has("--all");
const dryRun = has("--dry-run");
const indexOnly = has("--index-only");
const mergeExisting = has("--merge");

if (indexOnly) {
  const existingCatalogPath = path.join(outputRoot, "catalog.json");
  if (!fs.existsSync(existingCatalogPath)) {
    throw new Error(`Catálogo existente não encontrado: ${existingCatalogPath}`);
  }
  const existingCatalog = JSON.parse(fs.readFileSync(existingCatalogPath, "utf8"));
  fs.writeFileSync(path.join(outputRoot, "index.html"), renderHtml(existingCatalog));
  console.log(`Índice atualizado: ${path.join(outputRoot, "index.html")}`);
  process.exit(0);
}

if (!fs.existsSync(vpkPath)) throw new Error(`VPK não encontrado: ${vpkPath}`);

const voiceCatalog = JSON.parse(fs.readFileSync(voiceCatalogPath, "utf8"));
const heroCatalog = JSON.parse(fs.readFileSync(heroCatalogPath, "utf8"));
const announcerCatalog = JSON.parse(fs.readFileSync(announcerCatalogPath, "utf8"));
const voiceSources = {
  ...voiceCatalog.heroes,
  announcer: announcerCatalog.lines.map((line) => ({
    ...line,
    assetPath: normalizeAnnouncerAssetPath(line.assetPath),
  })),
};
const heroNames = new Map([
  ...heroCatalog.heroes.map((hero) => [hero.id, hero.name]),
  ["announcer", "Narrador padrão"],
]);
const selectedHeroIds = extractAll
  ? Object.keys(voiceSources)
  : requestedHero.split(",").map((value) => value.trim()).filter(Boolean);

for (const heroId of selectedHeroIds) {
  if (!voiceSources[heroId]) throw new Error(`Fonte de voz desconhecida: ${heroId}`);
}

console.log("Lendo índice do VPK...");
const entries = listVpkEntries(vpkPath);
const entryIndex = new Map(entries.map((entry) => [entry.path.toLowerCase(), entry]));
const candidateLines = selectedHeroIds.flatMap((heroId) =>
  voiceSources[heroId].map((line) => ({ ...line, heroId })),
);
const excluded = candidateLines
  .filter((line) => knownNonVerbalIds.has(line.id))
  .map((line) => ({
    heroId: line.heroId,
    id: line.id,
    reason: "vocalização sintética/não verbal fora do catálogo MP3 falado",
  }));
const selectedLines = candidateLines.filter((line) => !knownNonVerbalIds.has(line.id));
const estimatedBytes = selectedLines.reduce(
  (total, line) => total + (entryIndex.get(line.assetPath.toLowerCase())?.entryLength || 0),
  0,
);

console.log(
  `${selectedLines.length.toLocaleString("pt-BR")} falas selecionadas; ` +
  `até ${formatBytes(estimatedBytes)} de recursos compilados.`,
);
if (dryRun) process.exit(0);

const mp3Root = path.join(outputRoot, "mp3");
fs.mkdirSync(mp3Root, { recursive: true });
const result = [];
const failures = [];

for (let index = 0; index < selectedLines.length; index += 1) {
  const line = selectedLines[index];
  const entry = entryIndex.get(line.assetPath.toLowerCase());
  if (!entry) {
    failures.push({ heroId: line.heroId, id: line.id, error: "asset ausente no VPK" });
    continue;
  }
  try {
    const resource = readVpkEntryRecord(vpkPath, entry);
    const mp3 = extractEmbeddedMp3(resource, line.id);
    const heroDirectory = path.join(mp3Root, line.heroId);
    fs.mkdirSync(heroDirectory, { recursive: true });
    const destination = path.join(heroDirectory, `${line.id}.mp3`);
    fs.writeFileSync(destination, mp3);
    result.push({
      heroId: line.heroId,
      heroName: heroNames.get(line.heroId) || line.heroId,
      id: line.id,
      category: line.category,
      captionEn: line.captionEn,
      captionPtBr: line.captionPtBr,
      assetPath: line.assetPath,
      mp3: path.relative(outputRoot, destination).replaceAll("\\", "/"),
      bytes: mp3.length,
      sha256: crypto.createHash("sha256").update(mp3).digest("hex"),
    });
  } catch (error) {
    failures.push({ heroId: line.heroId, id: line.id, error: error.message });
  }
  if ((index + 1) % 250 === 0 || index + 1 === selectedLines.length) {
    process.stdout.write(`\r${index + 1}/${selectedLines.length}`);
  }
}
process.stdout.write("\n");

const existingCatalogPath = path.join(outputRoot, "catalog.json");
const existingCatalog = mergeExisting && fs.existsSync(existingCatalogPath)
  ? JSON.parse(fs.readFileSync(existingCatalogPath, "utf8"))
  : null;
const retainedLines = existingCatalog?.lines?.filter((line) => !selectedHeroIds.includes(line.heroId)) || [];
const retainedExclusions = existingCatalog?.exclusions?.filter((line) => !selectedHeroIds.includes(line.heroId)) || [];
const retainedFailures = existingCatalog?.failures?.filter((line) => !line.heroId || !selectedHeroIds.includes(line.heroId)) || [];
const catalogLines = [...retainedLines, ...result].sort((left, right) =>
  left.heroName.localeCompare(right.heroName, "pt-BR") || left.id.localeCompare(right.id, "en")
);
const catalog = {
  generatedAt: new Date().toISOString(),
  source: "Dota 2 instalado localmente; uso privado",
  vpkPath,
  build: voiceCatalog.build,
  heroes: [...new Set(catalogLines.map((line) => line.heroId))],
  extracted: catalogLines.length,
  excluded: retainedExclusions.length + excluded.length,
  failed: retainedFailures.length + failures.length,
  totalMp3Bytes: catalogLines.reduce((sum, line) => sum + line.bytes, 0),
  lines: catalogLines,
  exclusions: [...retainedExclusions, ...excluded],
  failures: [...retainedFailures, ...failures],
};
fs.writeFileSync(path.join(outputRoot, "catalog.json"), JSON.stringify(catalog, null, 2));
fs.writeFileSync(path.join(outputRoot, "index.html"), renderHtml(catalog));
fs.writeFileSync(
  path.join(outputRoot, "LEIA-ME.txt"),
  [
    "CATÁLOGO LOCAL DE VOICELINES DO DOTA 2",
    "",
    "Abra index.html no navegador para pesquisar e comparar as falas.",
    "Os MP3s foram retirados do fluxo embutido nos .vsnd_c, sem recompressão.",
    "Esta pasta é para uso local. Não envie build/local-audio ao Git ou ao portal público.",
    "",
    `MP3s no catálogo: ${catalog.extracted}`,
    `Extraídos nesta execução: ${result.length}`,
    `Excluídos por serem vocalizações não verbais: ${catalog.excluded}`,
    `Falhas técnicas: ${catalog.failed}`,
    `Tamanho dos MP3s: ${formatBytes(catalog.totalMp3Bytes)}`,
  ].join("\r\n"),
);

console.log(`Catálogo: ${path.join(outputRoot, "index.html")}`);
console.log(
  `MP3s no catálogo: ${catalog.extracted}; novos nesta execução: ${result.length}; ` +
  `falhas: ${catalog.failed}; ${formatBytes(catalog.totalMp3Bytes)}`,
);
