import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(root, "web", "data");
const outputRoot = path.join(root, "build", "caption-pack", "dota_brazilian");
const subtitlesRoot = path.join(outputRoot, "resource", "subtitles");

const heroes = JSON.parse(fs.readFileSync(path.join(dataRoot, "heroes.json"), "utf8"));
const voiceCatalog = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "voice-lines.json"), "utf8"),
);
const announcerCatalog = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "announcer-lines.json"), "utf8"),
);
const automatic = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "automatic-translations.json"), "utf8"),
);
const personaCatalogPath = path.join(dataRoot, "personas.json");
const personaCatalog = fs.existsSync(personaCatalogPath)
  ? JSON.parse(fs.readFileSync(personaCatalogPath, "utf8"))
  : { variants: [] };

const requestedHero = (() => {
  const index = process.argv.indexOf("--hero");
  return index >= 0 ? process.argv[index + 1] : null;
})();

function normalizeEnglish(value) {
  return value.trim().toLocaleLowerCase("en");
}

function escapeValve(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\r\n", "\\n")
    .replaceAll("\n", "\\n");
}

const sharedMemory = new Map();
const ambiguous = new Set();
const communityLines = Object.values(voiceCatalog.heroes)
  .flat()
  .filter((line) => line.captionPtBrSource === "community" && line.captionPtBr);
for (const line of communityLines) {
  const key = normalizeEnglish(line.captionEn);
  const previous = sharedMemory.get(key);
  if (previous && previous !== line.captionPtBr) ambiguous.add(key);
  else sharedMemory.set(key, line.captionPtBr);
}
for (const key of ambiguous) sharedMemory.delete(key);

function resolveTranslation(sourceId, line) {
  if (line.captionPtBr) {
    return {
      text: line.captionPtBr,
      source: line.captionPtBrSource || "official",
    };
  }
  if (sourceId !== "announcer") {
    const community = sharedMemory.get(normalizeEnglish(line.captionEn));
    if (community) return { text: community, source: "community" };
  }
  const generated = automatic.translations[sourceId]?.[line.id];
  return generated ? { text: generated, source: "automatic" } : null;
}

function renderSubtitleFile(tokens) {
  const rows = tokens
    .sort((left, right) => left.token.localeCompare(right.token))
    .map(
      ({ token, text }) =>
        `\t\t"${escapeValve(token)}"\t\t"${escapeValve(text)}"`,
    )
    .join("\r\n");
  return `\uFEFF"lang"\r\n{\r\n\t"Language"\t\t"brazilian"\r\n\t"Tokens"\r\n\t{\r\n${rows}\r\n\t}\r\n}\r\n`;
}

function expandKnownVoiceVariants(sourceId, tokens) {
  if (sourceId !== "axe") return tokens;

  // O arquivo oficial subtitles_axe_english.txt mantém a voz-base e a
  // variante Automaton no mesmo grupo. Os 284 pares têm o mesmo texto e se
  // distinguem apenas por axe_axe_* -> axe_auto_axe_*.
  const aliases = tokens
    .filter(({ token }) => token.startsWith("axe_axe_"))
    .map((token) => ({
      ...token,
      token: `axe_auto_${token.token.slice("axe_".length)}`,
      aliasOf: token.token,
    }));
  return [...tokens, ...aliases];
}

function includeCatalogedVariants(sourceId, tokens) {
  const seen = new Set(tokens.map((token) => token.token));
  const variants = personaCatalog.variants
    .filter((variant) => variant.heroId === sourceId)
    .flatMap((variant) =>
      variant.lines
        .filter((line) => line.captionPtBr && !seen.has(line.captionToken))
        .map((line) => {
          seen.add(line.captionToken);
          return {
            id: `${variant.id}:${line.id}`,
            token: line.captionToken,
            text: line.captionPtBr,
            source: line.captionPtBrSource || "community",
            variantId: variant.id,
          };
        }),
    );
  return [...tokens, ...variants];
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(subtitlesRoot, { recursive: true });

const sources = [];
for (const hero of heroes.heroes) {
  if (requestedHero && requestedHero !== hero.id) continue;
  const lines = voiceCatalog.heroes[hero.id] || [];
  const tokens = includeCatalogedVariants(
    hero.id,
    expandKnownVoiceVariants(hero.id, lines.flatMap((line) => {
      const resolved = resolveTranslation(hero.id, line);
      return resolved
        ? [{
            id: line.id,
            token: line.captionToken,
            text: resolved.text,
            source: resolved.source,
          }]
        : [];
    })),
  );
  if (!tokens.length) continue;
  sources.push({
    id: hero.id,
    directory: hero.voiceDirectory || hero.id,
    tokens,
  });
}

if (!requestedHero || requestedHero === "announcer") {
  const tokens = announcerCatalog.lines.flatMap((line) => {
    const resolved = resolveTranslation("announcer", line);
    return resolved
      ? [{
          id: line.id,
          token: line.captionToken,
          text: resolved.text,
          source: resolved.source,
        }]
      : [];
  });
  sources.push({ id: "announcer", directory: "announcer", tokens });
}

const manifestSources = [];
for (const source of sources) {
  const filename = `subtitles_${source.directory}_brazilian.txt`;
  const destination = path.join(subtitlesRoot, filename);
  const contents = renderSubtitleFile(source.tokens);
  fs.writeFileSync(destination, contents, "utf8");
  const sourceCounts = { official: 0, community: 0, automatic: 0 };
  for (const token of source.tokens) sourceCounts[token.source] += 1;
  manifestSources.push({
    id: source.id,
    filename,
    tokens: source.tokens.length,
    aliases: source.tokens.filter((token) => token.aliasOf).length,
    variantTokens: source.tokens.filter((token) => token.variantId).length,
    sources: sourceCounts,
    sha256: crypto.createHash("sha256").update(contents).digest("hex"),
  });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  language: "brazilian",
  build: voiceCatalog.build,
  files: manifestSources.length,
  tokens: manifestSources.reduce((sum, source) => sum + source.tokens, 0),
  sources: manifestSources.reduce(
    (totals, source) => ({
      official: totals.official + source.sources.official,
      community: totals.community + source.sources.community,
      automatic: totals.automatic + source.sources.automatic,
    }),
    { official: 0, community: 0, automatic: 0 },
  ),
  entries: manifestSources,
};
fs.writeFileSync(
  path.join(outputRoot, "caption-pack-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `${manifest.files} arquivos · ${manifest.tokens.toLocaleString("pt-BR")} captions PT-BR`,
);
console.log(outputRoot);
