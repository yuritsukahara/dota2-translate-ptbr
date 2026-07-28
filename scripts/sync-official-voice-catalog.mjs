import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { listVpkEntries, readVpkEntry } from "./lib/vpk.mjs";
import {
  baseVoicePrefixes,
  isCuratedVariantStem,
  matchesVoicePrefix,
} from "./lib/voice-sets.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultDota =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta";
const dotaRoot = process.env.DOTA2_ROOT || defaultDota;
const vpkPath = path.join(dotaRoot, "game", "dota", "pak01_dir.vpk");
const heroesPath = path.join(root, "web", "data", "heroes.json");
const outputPath = path.join(root, "web", "data", "voice-lines.json");
const suggestionsPath = path.join(
  root,
  "web",
  "data",
  "automatic-translations.json",
);

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
const nonverbalHeroes = new Set(["marci", "wisp"]);

function parseValveTokens(buffer) {
  const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return [...source.matchAll(/^\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"/gm)]
    .filter(([, key]) => key !== "Language")
    .map(([, key, value]) => ({
      key,
      value: value.replace(/\\"/g, '"').replace(/\\n/g, "\n"),
    }));
}

function normalizeEnglish(value) {
  return value.trim().toLocaleLowerCase("en");
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
const suggestions = fs.existsSync(suggestionsPath)
  ? JSON.parse(fs.readFileSync(suggestionsPath, "utf8")).translations || {}
  : {};
const suggestionsByLineId = new Map();
const ambiguousSuggestions = new Set();
for (const translations of Object.values(suggestions)) {
  for (const [lineId, text] of Object.entries(translations)) {
    const previous = suggestionsByLineId.get(lineId);
    if (previous && previous !== text) ambiguousSuggestions.add(lineId);
    else suggestionsByLineId.set(lineId, text);
  }
}
for (const lineId of ambiguousSuggestions) suggestionsByLineId.delete(lineId);
const existingCatalog = fs.existsSync(outputPath)
  ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
  : { heroes: {} };
const personasPath = path.join(root, "web", "data", "personas.json");
const existingPersonas = fs.existsSync(personasPath)
  ? JSON.parse(fs.readFileSync(personasPath, "utf8")).variants || []
  : [];
const knownTranslations = new Map();
const ambiguousTranslations = new Set();
for (const line of [
  ...Object.values(existingCatalog.heroes || {}).flat(),
  ...existingPersonas.flatMap((variant) => variant.lines || []),
]) {
  if (!line.captionPtBr) continue;
  const previous = knownTranslations.get(line.id);
  if (previous && previous.text !== line.captionPtBr) {
    ambiguousTranslations.add(line.id);
  } else {
    knownTranslations.set(line.id, {
      text: line.captionPtBr,
      source: line.captionPtBrSource || "community",
    });
  }
}
for (const lineId of ambiguousTranslations) knownTranslations.delete(lineId);
const communityMemory = new Map();
const ambiguousCommunityMemory = new Set();
for (const line of [
  ...Object.values(existingCatalog.heroes || {}).flat(),
  ...existingPersonas.flatMap((variant) => variant.lines || []),
]) {
  if (line.captionPtBrSource !== "community" || !line.captionPtBr) continue;
  const key = normalizeEnglish(line.captionEn);
  const previous = communityMemory.get(key);
  if (previous && previous !== line.captionPtBr) {
    ambiguousCommunityMemory.add(key);
  } else {
    communityMemory.set(key, line.captionPtBr);
  }
}
for (const key of ambiguousCommunityMemory) communityMemory.delete(key);
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
  const preservedCommunity = new Map(
    (existingCatalog.heroes?.[hero.id] || [])
      .filter(
        (line) =>
          line.captionPtBrSource === "community" && line.captionPtBr,
      )
      .map((line) => [line.id, line.captionPtBr]),
  );
  for (const token of englishTokens) {
    const stem = token.key.startsWith(`${directory}_`)
      ? token.key.slice(directory.length + 1)
      : token.key;
    if (stem.startsWith("auto_")) continue;
    const assetPath = assetByStem.get(stem);
    if (!assetPath) continue;
    const official = brazilianTokens.get(token.key) || null;
    const community = preservedCommunity.get(stem) || null;
    const suggested =
      suggestions[hero.id]?.[stem] || suggestionsByLineId.get(stem) || null;
    const known = knownTranslations.get(stem);
    const reusedCommunity = communityMemory.get(normalizeEnglish(token.value));
    matchedCandidates.push({
      id: stem,
      assetPath,
      category: categoryFromStem(stem),
      captionEn: token.value,
      captionPtBr:
        official ||
        community ||
        suggested ||
        known?.text ||
        reusedCommunity ||
        null,
      captionPtBrSource: official
        ? "official"
        : community
          ? "community"
          : suggested
            ? "automatic"
            : known?.source || (reusedCommunity ? "community" : null),
    });
  }

  const configuredBasePrefixes = baseVoicePrefixes[hero.id];
  let selectedPrefixes = configuredBasePrefixes || [];
  let matched;
  if (nonverbalHeroes.has(hero.id)) {
    matched = [];
    selectedPrefixes = [];
  } else if (configuredBasePrefixes) {
    matched = matchedCandidates.filter(
      (line) =>
        configuredBasePrefixes.some((prefix) =>
          matchesVoicePrefix(line.id, prefix),
        ) && !isCuratedVariantStem(hero.id, line.id),
    );
  } else {
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
    selectedPrefixes = selectedPrefix ? [selectedPrefix] : [];
    matched = selectedPrefix
      ? groups
          .get(selectedPrefix)
          .filter((line) => !isCuratedVariantStem(hero.id, line.id))
      : [];
  }

  matched.sort((left, right) => left.id.localeCompare(right.id));
  linesByHero[hero.id] = matched.map(({ assetPath: _assetPath, ...line }) => line);
  hero.voiceDirectory = directory;
  hero.voicePrefix = selectedPrefixes[0] || "";
  hero.voicePrefixes = selectedPrefixes;
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
  `${heroCatalog.heroes.length} heróis; ${totalLines} voicelines com caption EN; ${ptBrLines} com caption PT-BR.`
);
