import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./lib/csv.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifests = [];
const heroesRoot = path.join(root, "data", "heroes");

for (const entry of fs.readdirSync(heroesRoot, { withFileTypes: true })) {
  const manifest = path.join(heroesRoot, entry.name, "lines.csv");
  if (entry.isDirectory() && fs.existsSync(manifest)) manifests.push(manifest);
}

let failures = 0;
for (const manifest of manifests) {
  const [headers, ...rows] = parseCsv(fs.readFileSync(manifest, "utf8"));
  const required = ["id", "asset_path", "category", "pt_br", "status", "actor", "license", "notes"];
  const missing = required.filter((key) => !headers.includes(key));
  if (missing.length) {
    console.error(`${manifest}: colunas ausentes: ${missing.join(", ")}`);
    failures += 1;
    continue;
  }

  const objects = rows.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((key, i) => [key, row[i] || ""])));
  const ids = new Set();
  for (const line of objects) {
    const needsTranslation = !["excluded_nonverbal", "excluded_no_official_caption"].includes(line.voice_scope);
    if (!line.id || !line.asset_path || (needsTranslation && !line.pt_br) || !line.status) {
      console.error(`${manifest}: linha incompleta: ${line.id || "(sem id)"}`);
      failures += 1;
    }
    if (ids.has(line.id)) {
      console.error(`${manifest}: id duplicado: ${line.id}`);
      failures += 1;
    }
    ids.add(line.id);
    if (!["placeholder", "translated", "recorded", "reviewed"].includes(line.status)) {
      console.error(`${manifest}: status inválido em ${line.id}: ${line.status}`);
      failures += 1;
    }
    if (line.status === "recorded" || line.status === "reviewed") {
      if (!line.actor || !line.license) {
        console.error(`${manifest}: gravação sem ator/licença: ${line.id}`);
        failures += 1;
      }
    }
  }
  console.log(`${path.relative(root, manifest)}: ${objects.length} linhas válidas`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) {
    console.error(`${label}: esperado ${expected}, encontrado ${actual}`);
    failures += 1;
  }
}

const heroCatalog = readJson("web/data/heroes.json");
const voiceCatalog = readJson("web/data/voice-lines.json");
const personaCatalog = readJson("web/data/personas.json");
const announcerCatalog = readJson("web/data/announcer-lines.json");
const baseLines = Object.values(voiceCatalog.heroes).flat();
const personaLines = personaCatalog.variants.flatMap((variant) => variant.lines);
const announcerLines = announcerCatalog.lines;
const catalogTotal = baseLines.length + personaLines.length + announcerLines.length;

assertEqual("build do catálogo", String(heroCatalog.build.clientVersion), "6869");
assertEqual("heróis", heroCatalog.heroes.length, 127);
assertEqual("linhas base", baseLines.length, 46_871);
assertEqual("personas e variantes", personaCatalog.variants.length, 41);
assertEqual("linhas de personas e variantes", personaLines.length, 28_649);
assertEqual("linhas do narrador", announcerLines.length, 2_074);
assertEqual("captions totais", catalogTotal, 77_594);

const sources = { official: 0, community: 0, suggested: 0, missing: 0 };
for (const line of [...baseLines, ...personaLines, ...announcerLines]) {
  if (!line.captionPtBr) {
    sources.missing += 1;
  } else if (line.captionPtBrSource === "community") {
    sources.community += 1;
  } else if (line.captionPtBrSource === "automatic") {
    sources.suggested += 1;
  } else {
    sources.official += 1;
  }
}
assertEqual("captions oficiais PT-BR", sources.official, 1_399);
assertEqual("captions comunitárias", sources.community, 4_828);
assertEqual("captions sugeridas", sources.suggested, 71_367);
assertEqual("captions sem PT-BR", sources.missing, 0);

const hygieneTargets = [
  "README.md",
  "web/README.md",
  "CONTRIBUTING.md",
  "ATTRIBUTION.md",
  ".github",
  "docs",
  "web/app",
  "web/components",
  "web/lib",
  "web/db",
  "web/drizzle",
];
const textExtensions = new Set([".md", ".ts", ".tsx", ".js", ".mjs", ".json", ".yml", ".yaml", ".sql", ".css"]);
function collectTextFiles(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [absolute];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) =>
    collectTextFiles(path.relative(root, path.join(absolute, entry.name))),
  );
}
for (const file of hygieneTargets.flatMap(collectTextFiles)) {
  if (!textExtensions.has(path.extname(file))) continue;
  if (/\bdiscord\b/i.test(fs.readFileSync(file, "utf8"))) {
    console.error(`${path.relative(root, file)}: referência obsoleta à identidade removida`);
    failures += 1;
  }
}

console.log(
  `Catálogo build ${heroCatalog.build.clientVersion}: ${catalogTotal.toLocaleString("pt-BR")} captions ` +
  `(${sources.official.toLocaleString("pt-BR")} oficiais, ` +
  `${sources.community.toLocaleString("pt-BR")} comunitárias, ` +
  `${sources.suggested.toLocaleString("pt-BR")} sugeridas)`,
);

if (failures) process.exitCode = 1;
