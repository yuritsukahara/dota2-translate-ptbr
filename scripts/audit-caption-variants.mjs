import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { listVpkEntries, readVpkEntry } from "./lib/vpk.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dotaRoot =
  process.env.DOTA2_ROOT ||
  String.raw`C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta`;
const vpkPath = path.join(dotaRoot, "game", "dota", "pak01_dir.vpk");
const heroesPath = path.join(root, "web", "data", "heroes.json");
const packRoot = path.join(root, "build", "caption-pack", "dota_brazilian");
const packSubtitles = path.join(packRoot, "resource", "subtitles");
const outputPath = path.join(root, "build", "caption-variant-audit.json");

function parseTokens(buffer) {
  const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return [...source.matchAll(/^\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"/gm)]
    .filter(([, key]) => key !== "Language" && !key.startsWith("[english]"))
    .map(([, key, value]) => ({ key, value }));
}

function variantPrefix(token, directory) {
  const stem = token.startsWith(`${directory}_`)
    ? token.slice(directory.length + 1)
    : token;
  return stem.split("_", 1)[0] || "(sem-prefixo)";
}

function countByPrefix(tokens, directory) {
  const counts = new Map();
  for (const token of tokens) {
    const prefix = variantPrefix(token.key, directory);
    counts.set(prefix, (counts.get(prefix) || 0) + 1);
  }
  return counts;
}

if (!fs.existsSync(vpkPath)) throw new Error(`VPK não encontrado: ${vpkPath}`);
if (!fs.existsSync(heroesPath)) {
  throw new Error(`Catálogo de heróis não encontrado: ${heroesPath}`);
}

const entryPaths = new Set(listVpkEntries(vpkPath).map((entry) => entry.path));
const heroes = JSON.parse(fs.readFileSync(heroesPath, "utf8")).heroes;
const results = [];

for (const hero of heroes) {
  const directory = hero.voiceDirectory || hero.id;
  const englishPath =
    `resource/subtitles/subtitles_${directory}_english.txt`;
  if (!entryPaths.has(englishPath)) {
    results.push({
      id: hero.id,
      name: hero.name,
      directory,
      basePrefix: hero.voicePrefix || "",
      official: 0,
      included: 0,
      missing: 0,
      missingSubtitleFile: true,
      groups: [],
    });
    continue;
  }

  const officialTokens = parseTokens(readVpkEntry(vpkPath, englishPath));
  const generatedPath = path.join(
    packSubtitles,
    `subtitles_${directory}_brazilian.txt`,
  );
  const generatedTokens = fs.existsSync(generatedPath)
    ? parseTokens(fs.readFileSync(generatedPath))
    : [];
  const includedKeys = new Set(generatedTokens.map((token) => token.key));
  const officialByPrefix = countByPrefix(officialTokens, directory);
  const includedByPrefix = countByPrefix(
    officialTokens.filter((token) => includedKeys.has(token.key)),
    directory,
  );
  const groups = [...officialByPrefix]
    .map(([prefix, official]) => {
      const included = includedByPrefix.get(prefix) || 0;
      return {
        prefix,
        official,
        included,
        missing: official - included,
        isBase: prefix === hero.voicePrefix,
      };
    })
    .sort(
      (left, right) =>
        Number(right.isBase) - Number(left.isBase) ||
        right.missing - left.missing ||
        left.prefix.localeCompare(right.prefix),
    );
  const included = officialTokens.filter((token) =>
    includedKeys.has(token.key)
  ).length;
  results.push({
    id: hero.id,
    name: hero.name,
    directory,
    basePrefix: hero.voicePrefix || "",
    official: officialTokens.length,
    included,
    missing: officialTokens.length - included,
    missingSubtitleFile: false,
    groups,
  });
}

const totals = results.reduce(
  (sum, hero) => ({
    heroes: sum.heroes + 1,
    official: sum.official + hero.official,
    included: sum.included + hero.included,
    missing: sum.missing + hero.missing,
    missingFiles: sum.missingFiles + Number(hero.missingSubtitleFile),
  }),
  { heroes: 0, official: 0, included: 0, missing: 0, missingFiles: 0 },
);
const variantGroups = results
  .flatMap((hero) =>
    hero.groups
      .filter((group) => !group.isBase && group.missing > 0)
      .map((group) => ({
        heroId: hero.id,
        hero: hero.name,
        directory: hero.directory,
        ...group,
      })),
  )
  .sort(
    (left, right) =>
      right.missing - left.missing ||
      left.hero.localeCompare(right.hero, "pt-BR"),
  );

const audit = {
  generatedAt: new Date().toISOString(),
  dotaRoot,
  totals,
  heroes: results,
  variantGroups,
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");

console.log(
  `${totals.included.toLocaleString("pt-BR")} de ` +
    `${totals.official.toLocaleString("pt-BR")} tokens oficiais EN cobertos; ` +
    `${totals.missing.toLocaleString("pt-BR")} ausentes.`,
);
console.log(
  `${variantGroups.length} grupos de variante/persona com tokens ausentes.`,
);
console.log(outputPath);
