import fs from "node:fs";
import path from "node:path";
import { readVpkEntry } from "./lib/vpk.mjs";

const workspace = path.resolve(import.meta.dirname, "..");
const defaultVpk =
  "C:/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/dota/pak01_dir.vpk";
const vpkPath = process.argv[2] || process.env.DOTA_VPK_PATH || defaultVpk;
const heroCatalog = JSON.parse(
  fs.readFileSync(path.join(workspace, "web/data/heroes.json"), "utf8"),
);

function parseTokens(file) {
  const source = readVpkEntry(vpkPath, file).toString("utf8").replace(/^\uFEFF/, "");
  const tokens = new Map();
  for (const match of source.matchAll(/^\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"/gm)) {
    tokens.set(match[1].toLowerCase(), match[2].replaceAll('\\"', '"'));
  }
  return tokens;
}

function merge(files) {
  const result = new Map();
  for (const file of files) {
    for (const [key, value] of parseTokens(file)) result.set(key, value);
  }
  return result;
}

const english = merge([
  "resource/localization/dota_english.txt",
  "resource/localization/abilities_english.txt",
  "resource/localization/items_english.txt",
]);
const brazilian = merge([
  "resource/localization/dota_brazilian.txt",
  "resource/localization/abilities_brazilian.txt",
  "resource/localization/items_brazilian.txt",
]);

const heroes = heroCatalog.heroes.map((hero) => {
  const key = `npc_dota_hero_${hero.id}`.toLowerCase();
  return {
    key,
    en: english.get(key) || hero.name,
    ptBr: brazilian.get(key) || english.get(key) || hero.name,
  };
});

const itemPrefix = "dota_tooltip_ability_item_";
const rejectedSuffixes =
  /_(description|lore|note\d*|facet|aghanim|shard|alt|subtitle|ad|recipe)$/i;
const items = [];
for (const [key, en] of english) {
  if (!key.startsWith(itemPrefix) || rejectedSuffixes.test(key)) continue;
  const ptBr = brazilian.get(key);
  if (!ptBr || !en || en.length > 80 || ptBr.length > 80 || /[<>%]/.test(en + ptBr)) continue;
  items.push({ key, en, ptBr });
}

const unique = (entries) => [
  ...new Map(entries.map((entry) => [entry.en.toLocaleLowerCase("en"), entry])).values(),
].sort((left, right) => left.en.localeCompare(right.en, "en"));

const output = {
  source: "Arquivos oficiais de localização do Dota 2 instalado localmente",
  generatedAt: new Date().toISOString(),
  heroes: unique(heroes),
  items: unique(items),
};
const destination = path.join(workspace, "web/data/terminology.json");
fs.writeFileSync(destination, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Glossário salvo: ${output.heroes.length} heróis e ${output.items.length} itens.`);
