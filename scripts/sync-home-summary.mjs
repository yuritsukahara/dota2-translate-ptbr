import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(root, "web", "data");
const heroesCatalog = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "heroes.json"), "utf8"),
);
const voices = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "voice-lines.json"), "utf8"),
).heroes;
const personas = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "personas.json"), "utf8"),
).variants;
const announcer = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "announcer-lines.json"), "utf8"),
).lines;

const featuredHeroIds = [
  "crystal_maiden",
  "invoker",
  "juggernaut",
  "pudge",
];
const featuredPersonaIds = [
  "crystal_maiden-blueheart",
  "phantom-assassin-asan",
  "dragon-knight-davion",
  "invoker-kid",
];

function lineStats(lines) {
  const stats = {
    total: lines.length,
    translated: 0,
    official: 0,
    community: 0,
    suggested: 0,
  };
  for (const line of lines) {
    if (!line.captionPtBr) continue;
    stats.translated += 1;
    if (line.captionPtBrSource === "official") stats.official += 1;
    else if (line.captionPtBrSource === "community") stats.community += 1;
    else stats.suggested += 1;
  }
  return stats;
}

const featuredHeroes = featuredHeroIds.map((id) => {
  const hero = heroesCatalog.heroes.find((candidate) => candidate.id === id);
  const lines = voices[id] || [];
  return {
    id,
    name: hero.name,
    imageUrl: hero.imageUrl,
    ...lineStats(lines),
    voicePrefix: (hero.voicePrefixes || [hero.voicePrefix])
      .filter(Boolean)
      .join(" + "),
  };
});
const featuredPersonas = featuredPersonaIds.map((id) => {
  const persona = personas.find((candidate) => candidate.id === id);
  return {
    id,
    name: persona.name,
    imageUrl: persona.imageUrl,
    ...lineStats(persona.lines),
    voicePrefix: persona.prefixes.join(" + "),
  };
});
const allLines = [
  ...Object.values(voices).flat(),
  ...personas.flatMap((persona) => persona.lines),
  ...announcer,
];
const summary = {
  build: heroesCatalog.build.clientVersion,
  catalogTotal: allLines.length,
  translatedTotal: allLines.filter((line) => line.captionPtBr).length,
  heroCount: heroesCatalog.heroes.length,
  personaCount: personas.length,
  featuredHeroes,
  featuredPersonas,
};

fs.writeFileSync(
  path.join(dataRoot, "home-summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
);
console.log(
  `${summary.catalogTotal.toLocaleString("pt-BR")} captions; ` +
    `${summary.translatedTotal.toLocaleString("pt-BR")} com PT-BR; ` +
    `${summary.personaCount} personas/variantes.`,
);

