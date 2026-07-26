import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { listVpkEntries, readVpkEntry } from "./lib/vpk.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultDota =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta";
const dotaRoot = process.env.DOTA2_ROOT || defaultDota;
const vpkPath = path.join(dotaRoot, "game", "dota", "pak01_dir.vpk");
const heroesPath = path.join(root, "web", "data", "heroes.json");
const outputPath = path.join(root, "web", "data", "voice-lines.json");

const directoryAliases = {
  crystal_maiden: "crystalmaiden",
  drow_ranger: "drowranger",
  obsidian_destroyer: "outworld_destroyer",
  pangolier: "pangolin",
  sand_king: "sandking",
  shadow_shaman: "shadowshaman",
  storm_spirit: "stormspirit",
  witch_doctor: "witchdoctor",
};

function parseValveTokens(buffer) {
  const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return [...source.matchAll(/^\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"/gm)]
    .filter(([, key]) => key !== "Language")
    .map(([, key, value]) => ({
      key,
      value: value.replace(/\\"/g, '"').replace(/\\n/g, "\n"),
    }));
}

function categoryFromStem(stem) {
  return stem
    .replace(/^[^_]+_/, "")
    .replace(/_\d+[a-z]?$/i, "")
    .replace(/_\d+$/i, "");
}

function prefixScore(prefix, directory, heroName) {
  const normalizedDirectory = directory.replaceAll("_", "");
  const normalizedPrefix = prefix.replaceAll("_", "");
  const initials = heroName
    .split(/[\s-]+/)
    .map((part) => part[0]?.toLowerCase() || "")
    .join("");
  if (normalizedPrefix === normalizedDirectory) return 1000;
  if (normalizedDirectory.startsWith(normalizedPrefix)) {
    return 900 + normalizedPrefix.length;
  }
  if (normalizedPrefix === initials) return 880;
  if (normalizedPrefix.startsWith(normalizedDirectory)) return 850;
  return 0;
}

const entries = listVpkEntries(vpkPath);
const entryPaths = new Set(entries.map((entry) => entry.path));
const heroCatalog = JSON.parse(fs.readFileSync(heroesPath, "utf8"));
const linesByHero = {};

for (const hero of heroCatalog.heroes) {
  const directory = directoryAliases[hero.id] || hero.id;
  const audioPrefix = `sounds/vo/${directory}/`;
  const assets = entries
    .map((entry) => entry.path)
    .filter(
      (entryPath) =>
        entryPath.startsWith(audioPrefix) &&
        entryPath.endsWith(".vsnd_c") &&
        !entryPath.slice(audioPrefix.length).includes("/")
    );
  const assetByStem = new Map(
    assets.map((assetPath) => [
      path.posix.basename(assetPath, ".vsnd_c"),
      assetPath,
    ])
  );

  const englishPath = `resource/subtitles/subtitles_${directory}_english.txt`;
  const brazilianPath = `resource/subtitles/subtitles_${directory}_brazilian.txt`;
  const englishTokens = entryPaths.has(englishPath)
    ? parseValveTokens(readVpkEntry(vpkPath, englishPath))
    : [];
  const brazilianTokens = entryPaths.has(brazilianPath)
    ? new Map(
        parseValveTokens(readVpkEntry(vpkPath, brazilianPath)).map((token) => [
          token.key,
          token.value,
        ])
      )
    : new Map();

  const matchedCandidates = [];
  for (const token of englishTokens) {
    const stem = token.key.startsWith(`${directory}_`)
      ? token.key.slice(directory.length + 1)
      : token.key;
    if (stem.startsWith("auto_")) continue;
    const assetPath = assetByStem.get(stem);
    if (!assetPath) continue;
    matchedCandidates.push({
      id: stem,
      assetPath,
      category: categoryFromStem(stem),
      captionToken: token.key,
      captionEn: token.value,
      captionPtBr: brazilianTokens.get(token.key) || null,
      originalAudio: "dota_local",
    });
  }

  const groups = new Map();
  for (const line of matchedCandidates) {
    const prefix = line.id.split("_", 1)[0];
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(line);
  }
  const selectedPrefix = [...groups.keys()].sort((left, right) => {
    const scoreDifference =
      prefixScore(right, directory, hero.name) -
      prefixScore(left, directory, hero.name);
    if (scoreDifference) return scoreDifference;
    return groups.get(right).length - groups.get(left).length;
  })[0];
  const matched = selectedPrefix ? groups.get(selectedPrefix) : [];

  matched.sort((left, right) => left.id.localeCompare(right.id));
  linesByHero[hero.id] = matched;
  hero.voiceDirectory = directory;
  hero.voicePrefix = selectedPrefix || "";
  hero.assetTotal = matched.length;
  hero.total = matched.length;
  hero.officialEnglishCaptions = matched.length;
  hero.officialBrazilianCaptions = matched.filter(
    (line) => line.captionPtBr
  ).length;
  hero.hasOfficialEnglishCaptions = matched.length > 0;
  hero.hasOfficialBrazilianCaptions = hero.officialBrazilianCaptions > 0;
  hero.active = false;
  hero.drafted = 0;
  hero.translated = 0;
  hero.recorded = 0;
  hero.reviewed = 0;
}

heroCatalog.heroes.sort((left, right) =>
  left.name.localeCompare(right.name, "pt-BR")
);
heroCatalog.generatedAt = new Date().toISOString();
heroCatalog.source =
  "OpenDota heroStats + captions oficiais e inventário do VPK local";

fs.writeFileSync(heroesPath, `${JSON.stringify(heroCatalog, null, 2)}\n`);
fs.writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      build: heroCatalog.build,
      source: "VPK local; nenhum áudio original é redistribuído",
      heroes: linesByHero,
    },
    null,
    2
  )}\n`
);

const totalLines = Object.values(linesByHero).reduce(
  (sum, lines) => sum + lines.length,
  0
);
const ptBrLines = Object.values(linesByHero)
  .flat()
  .filter((line) => line.captionPtBr).length;
console.log(
  `${heroCatalog.heroes.length} heróis; ${totalLines} voicelines com caption EN; ${ptBrLines} com caption oficial PT-BR.`
);
