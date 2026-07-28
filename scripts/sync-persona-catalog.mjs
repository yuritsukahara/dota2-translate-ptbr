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
const dataRoot = path.join(root, "web", "data");
const auditPath = path.join(root, "build", "caption-variant-audit.json");
const outputPath = path.join(dataRoot, "personas.json");
const voicePackVariantIdsPath = path.join(
  dataRoot,
  "voice-pack-variant-ids.json",
);
const imageOverridePath = path.join(
  root,
  "data",
  "persona-image-overrides.json",
);

const personaDefinitions = [
  {
    id: "antimage-wei",
    heroId: "antimage",
    prefixes: ["amp"],
    name: "Wei — Persona da Anti-Mage",
    type: "persona",
  },
  {
    id: "dragon-knight-davion",
    heroId: "dragon_knight",
    prefixes: ["dk"],
    name: "Davion — Persona do Dragon Knight",
    type: "persona",
  },
  {
    id: "invoker-kid",
    heroId: "invoker",
    prefixes: ["kidvoker", "kidvo"],
    name: "Invoker Criança",
    type: "persona",
  },
  {
    id: "mirana-nightsilver",
    heroId: "mirana",
    prefixes: ["mir"],
    name: "Mirana de Nightsilver",
    type: "persona",
  },
  {
    id: "phantom-assassin-asan",
    heroId: "phantom_assassin",
    prefixes: ["phass"],
    name: "Asan — Persona da Phantom Assassin",
    type: "persona",
  },
  {
    id: "pudge-toy-butcher",
    heroId: "pudge",
    prefixes: ["toy"],
    name: "Açougueiro de Brinquedo",
    type: "persona",
  },
];

function parseTokens(buffer) {
  const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return [...source.matchAll(/^\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"/gm)]
    .filter(([, key]) => key !== "Language" && !key.startsWith("[english]"))
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

function variantPrefix(token, directory) {
  const stem = token.startsWith(`${directory}_`)
    ? token.slice(directory.length + 1)
    : token;
  return stem.split("_", 1)[0] || "(sem-prefixo)";
}

function stemFromToken(token, directory) {
  return token.startsWith(`${directory}_`)
    ? token.slice(directory.length + 1)
    : token;
}

if (!fs.existsSync(auditPath)) {
  throw new Error(
    `Auditoria não encontrada. Execute primeiro: node scripts/audit-caption-variants.mjs`,
  );
}

const heroesCatalog = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "heroes.json"), "utf8"),
);
const voiceCatalog = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "voice-lines.json"), "utf8"),
);
const automatic = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "automatic-translations.json"), "utf8"),
);
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const imageOverrides = fs.existsSync(imageOverridePath)
  ? JSON.parse(fs.readFileSync(imageOverridePath, "utf8")).variants
  : {};
const heroesById = new Map(
  heroesCatalog.heroes.map((hero) => [hero.id, hero]),
);
const entries = listVpkEntries(vpkPath);
const entryPaths = new Set(entries.map((entry) => entry.path));

const memoryCandidates = new Map();
const ambiguousMemory = new Set();
for (const [heroId, lines] of Object.entries(voiceCatalog.heroes)) {
  for (const line of lines) {
    const text =
      line.captionPtBr ||
      automatic.translations[heroId]?.[line.id];
    if (!text) continue;
    const source = line.captionPtBr
      ? line.captionPtBrSource || "official"
      : "automatic";
    const key = normalizeEnglish(line.captionEn);
    const previous = memoryCandidates.get(key);
    if (previous && previous.text !== text) ambiguousMemory.add(key);
    else memoryCandidates.set(key, { text, source });
  }
}
for (const key of ambiguousMemory) memoryCandidates.delete(key);

const knownPrefixKeys = new Set(
  personaDefinitions.flatMap((definition) =>
    definition.prefixes.map((prefix) => `${definition.heroId}:${prefix}`),
  ),
);
const definitions = [
  ...personaDefinitions,
  ...audit.variantGroups
    .filter(
      (group) =>
        group.official >= 20 &&
        !knownPrefixKeys.has(`${group.heroId}:${group.prefix}`),
    )
    .map((group) => ({
      id: `${group.heroId}-${group.prefix}`,
      heroId: group.heroId,
      prefixes: [group.prefix],
      name: `${group.hero} — variante ${group.prefix.toUpperCase()}`,
      type: "voice_variant",
    })),
];

const variants = [];
for (const definition of definitions) {
  const hero = heroesById.get(definition.heroId);
  if (!hero) continue;
  const directory = hero.voiceDirectory || hero.id;
  const englishPath =
    `resource/subtitles/subtitles_${directory}_english.txt`;
  if (!entryPaths.has(englishPath)) continue;
  const brazilianPath =
    `resource/subtitles/subtitles_${directory}_brazilian.txt`;
  const officialBrazilian = entryPaths.has(brazilianPath)
    ? new Map(
        parseTokens(readVpkEntry(vpkPath, brazilianPath)).map((token) => [
          token.key,
          token.value,
        ]),
      )
    : new Map();
  const lines = parseTokens(readVpkEntry(vpkPath, englishPath))
    .filter((token) =>
      definition.prefixes.includes(variantPrefix(token.key, directory)),
    )
    .map((token) => {
      const stem = stemFromToken(token.key, directory);
      const official = officialBrazilian.get(token.key);
      const generated = automatic.translations[definition.id]?.[stem];
      const reused = memoryCandidates.get(normalizeEnglish(token.value));
      return {
        id: stem,
        assetPath: `sounds/vo/${directory}/${stem}.vsnd_c`,
        category: categoryFromStem(stem),
        captionToken: token.key,
        captionEn: token.value,
        captionPtBr: official || generated || reused?.text || null,
        captionPtBrSource: official
          ? "official"
          : generated
            ? "automatic"
            : reused?.source || null,
        originalAudio: "dota_local",
      };
    });
  const availableAudio = new Set(
    entries
      .map((entry) => entry.path)
      .filter((entryPath) =>
        entryPath.startsWith(`sounds/vo/${directory}/`) &&
        entryPath.endsWith(".vsnd_c"),
      ),
  );
  for (const line of lines) {
    if (!availableAudio.has(line.assetPath)) line.assetPath = "";
  }
  const translated = lines.filter((line) => line.captionPtBr).length;
  const imageOverride = imageOverrides[definition.id];
  variants.push({
    ...definition,
    heroName: hero.name,
    imageUrl:
      imageOverride?.imageUrl ||
      (imageOverride ? `/images/personas/${definition.id}.png` : hero.imageUrl),
    iconUrl: hero.iconUrl,
    imageAssetPath: imageOverride?.asset || null,
    voiceDirectory: directory,
    total: lines.length,
    translated,
    officialBrazilianCaptions: lines.filter(
      (line) => line.captionPtBrSource === "official",
    ).length,
    reusedCaptions: lines.filter(
      (line) =>
        line.captionPtBrSource === "community" ||
        line.captionPtBrSource === "automatic",
    ).length,
    audioAssets: lines.filter((line) => line.assetPath).length,
    lines: lines.map(
      ({ assetPath: _assetPath, captionToken: _captionToken, originalAudio: _originalAudio, ...line }) =>
        line,
    ),
  });
}

variants.sort(
  (left, right) =>
    Number(left.type !== "persona") - Number(right.type !== "persona") ||
    left.name.localeCompare(right.name, "pt-BR"),
);
const output = {
  generatedAt: new Date().toISOString(),
  build: heroesCatalog.build,
  source: "VPK local; personas e variantes preservam o denominador separado",
  variants,
};
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
fs.writeFileSync(
  voicePackVariantIdsPath,
  `${JSON.stringify(variants.map((variant) => variant.id), null, 2)}\n`,
  "utf8",
);

console.log(
  `${variants.length} personas/variantes; ` +
    `${variants.reduce((sum, item) => sum + item.total, 0).toLocaleString("pt-BR")} linhas; ` +
    `${variants.reduce((sum, item) => sum + item.translated, 0).toLocaleString("pt-BR")} com PT-BR reaproveitado.`,
);
console.log(outputPath);
