import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { listVpkEntries, readVpkEntry } from "./lib/vpk.mjs";
import {
  baseVoicePrefixes,
  curatedVoiceVariants,
  matchesVoicePrefix,
} from "./lib/voice-sets.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dotaRoot =
  process.env.DOTA2_ROOT ||
  String.raw`C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta`;
const vpkPath = path.join(dotaRoot, "game", "dota", "pak01_dir.vpk");
const dataRoot = path.join(root, "web", "data");
const outputPath = path.join(root, "build", "voice-set-partition-audit.json");

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
const semanticFixtures = {
  cm_wolf_item_103: "crystal_maiden-blueheart",
  erth_move_07: "earthshaker",
  earth_arcana_ability_aghs_fly_01_01: "earthshaker-erth",
  phass_spawn_01: "phantom_assassin",
  pa_asan_ally_001: "phantom-assassin-asan",
  phass_arc_spawn_01: "phantom_assassin-arcana",
  terr_ally_01: "terrorblade",
  terr_shards_spawn_01: "terrorblade-arcana",
  spec_ability_haunt_01: "spectre",
  spec_redux_spawn_01: "spectre-mercurials-call",
};

function parseTokens(buffer) {
  const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return [...source.matchAll(/^\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"/gm)]
    .filter(([, key]) => key !== "Language" && !key.startsWith("[english]"))
    .map(([, key]) => key);
}

function stemFromToken(token, directory) {
  return token.startsWith(`${directory}_`)
    ? token.slice(directory.length + 1)
    : token;
}

if (!fs.existsSync(vpkPath)) throw new Error(`VPK não encontrado: ${vpkPath}`);

const heroes = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "heroes.json"), "utf8"),
).heroes;
const voices = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "voice-lines.json"), "utf8"),
).heroes;
const personas = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "personas.json"), "utf8"),
).variants;
const entries = listVpkEntries(vpkPath);
const entryPaths = new Set(entries.map((entry) => entry.path));
const definedVariantIds = new Set(
  curatedVoiceVariants.map((variant) => variant.id),
);
const catalogVariantIds = new Set(personas.map((variant) => variant.id));
const unexpectedVariants = [...catalogVariantIds].filter(
  (id) => !definedVariantIds.has(id),
);
const missingVariants = [...definedVariantIds].filter(
  (id) => !catalogVariantIds.has(id),
);
const actualOwnerByLineId = new Map();
const report = {
  generatedAt: new Date().toISOString(),
  build: JSON.parse(
    fs.readFileSync(path.join(dataRoot, "heroes.json"), "utf8"),
  ).build,
  heroes: [],
  definitions: {
    curated: definedVariantIds.size,
    cataloged: catalogVariantIds.size,
    unexpectedVariants,
    missingVariants,
  },
  semanticFixtures: [],
  totals: {
    raw: 0,
    assigned: 0,
    duplicates: 0,
    missing: 0,
    extra: 0,
    prefixViolations: 0,
    definitionMismatches:
      unexpectedVariants.length + missingVariants.length,
    semanticMismatches: 0,
  },
};

for (const hero of heroes) {
  const directory = directoryAliases[hero.id] || hero.voiceDirectory || hero.id;
  const englishPath = `resource/subtitles/subtitles_${directory}_english.txt`;
  const assetPrefix = `sounds/vo/${directory}/`;
  const assets = new Set(
    entries
      .map((entry) => entry.path)
      .filter(
        (entryPath) =>
          entryPath.startsWith(assetPrefix) &&
          entryPath.endsWith(".vsnd_c") &&
          !entryPath.slice(assetPrefix.length).includes("/"),
      )
      .map((entryPath) => path.posix.basename(entryPath, ".vsnd_c")),
  );
  const raw = entryPaths.has(englishPath)
    ? new Set(
        parseTokens(readVpkEntry(vpkPath, englishPath))
          .map((token) => stemFromToken(token, directory))
          .filter(
            (stem) =>
              assets.has(stem) && !nonverbalHeroes.has(hero.id),
          ),
      )
    : new Set();
  const groups = [
    { id: hero.id, kind: "base", lines: voices[hero.id] || [] },
    ...personas
      .filter((variant) => variant.heroId === hero.id)
      .map((variant) => ({ ...variant, kind: "variant" })),
  ];
  const owners = new Map();
  const duplicates = [];
  const prefixViolations = [];

  for (const group of groups) {
    for (const line of group.lines) {
      if (owners.has(line.id)) {
        duplicates.push({
          lineId: line.id,
          first: owners.get(line.id),
          second: group.id,
        });
      } else {
        owners.set(line.id, group.id);
        actualOwnerByLineId.set(line.id, group.id);
      }
      if (group.kind === "base") {
        const prefixes =
          baseVoicePrefixes[hero.id] ||
          hero.voicePrefixes ||
          [hero.voicePrefix].filter(Boolean);
        const reserved = curatedVoiceVariants
          .filter((variant) => variant.heroId === hero.id)
          .flatMap((variant) => variant.prefixes);
        if (
          !prefixes.some((prefix) => matchesVoicePrefix(line.id, prefix)) ||
          reserved.some((prefix) => matchesVoicePrefix(line.id, prefix))
        ) {
          prefixViolations.push({ lineId: line.id, owner: group.id });
        }
      } else if (
        !group.prefixes.some((prefix) => matchesVoicePrefix(line.id, prefix))
      ) {
        prefixViolations.push({ lineId: line.id, owner: group.id });
      }
    }
  }

  const assigned = new Set(owners.keys());
  const missing = [...raw].filter((lineId) => !assigned.has(lineId));
  const extra = [...assigned].filter((lineId) => !raw.has(lineId));
  report.heroes.push({
    id: hero.id,
    directory,
    raw: raw.size,
    assigned: assigned.size,
    groups: groups.map((group) => ({
      id: group.id,
      kind: group.kind,
      lines: group.lines.length,
    })),
    duplicates,
    missing,
    extra,
    prefixViolations,
  });
  report.totals.raw += raw.size;
  report.totals.assigned += assigned.size;
  report.totals.duplicates += duplicates.length;
  report.totals.missing += missing.length;
  report.totals.extra += extra.length;
  report.totals.prefixViolations += prefixViolations.length;
}

for (const [lineId, expectedOwner] of Object.entries(semanticFixtures)) {
  const actualOwner = actualOwnerByLineId.get(lineId) || null;
  report.semanticFixtures.push({ lineId, expectedOwner, actualOwner });
  if (actualOwner !== expectedOwner) report.totals.semanticMismatches += 1;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

const failures = Object.entries(report.totals).filter(
  ([key, value]) => !["raw", "assigned"].includes(key) && value !== 0,
);
console.log(
  `${report.heroes.length} heróis auditados; ` +
    `${report.totals.assigned.toLocaleString("pt-BR")} linhas atribuídas de ` +
    `${report.totals.raw.toLocaleString("pt-BR")} assets com caption.`,
);
console.log(
  `${report.totals.duplicates} duplicadas; ${report.totals.missing} ausentes; ` +
    `${report.totals.extra} extras; ${report.totals.prefixViolations} violações de prefixo; ` +
    `${report.totals.definitionMismatches} grupos sem regra explícita; ` +
    `${report.totals.semanticMismatches} controles semânticos divergentes.`,
);
console.log(outputPath);
if (failures.length) process.exitCode = 1;
