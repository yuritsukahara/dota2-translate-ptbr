import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readVpkEntry } from "./lib/vpk.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dotaRoot =
  process.env.DOTA2_ROOT ||
  String.raw`C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta`;
const baseVpk = path.join(dotaRoot, "game", "dota", "pak01_dir.vpk");
const captionPackRoot = path.join(
  root,
  "build",
  "caption-pack",
  "dota_brazilian",
);
const dataRoot = path.join(root, "web", "data");
const manifestPath = path.join(captionPackRoot, "caption-pack-manifest.json");
const subtitlesRoot = path.join(captionPackRoot, "resource", "subtitles");
const outputRoot = path.join(
  root,
  "build",
  "caption-anchor-test",
  "resource",
  "subtitles",
);
const outputManifestPath = path.join(outputRoot, "caption-anchor-manifest.json");
const outputLanguages = ["brazilian", "english", "russian"];
const maxAnchorTokens = Number(process.env.CAPTION_ANCHOR_MAX_TOKENS || 55_000);
// Preserve the exact 6869.8 anchor ordering validated in the normal client.
// These four later catalog additions are covered by the supplemental anchors.
const deferredFromFunctionalAnchor = new Set([
  "monkey_king_monkey_ally_58",
  "monkey_king_monkey_ally_80",
  "monkey_king_monkey_ally_95",
  "muerta_muerta_dead_shot_kill_08",
]);

if (!fs.existsSync(manifestPath)) {
  throw new Error(`Gere primeiro o pacote de captions: ${manifestPath}`);
}
if (!fs.existsSync(baseVpk)) {
  throw new Error(`VPK principal não encontrado: ${baseVpk}`);
}

let announcer = readVpkEntry(
  baseVpk,
  "resource/subtitles/subtitles_announcer_brazilian.txt",
).toString("utf8");
if (process.env.CAPTION_ANCHOR_MARKER === "1") {
  announcer = announcer.replace(
    /("announcer_announcer_battle_prepare_01"\s+)"[^"]*"/,
    '$1"TESTE ANCORA EXTERNA ATIVA"',
  );
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const rowsByToken = new Map();
for (const entry of manifest.entries || []) {
  const subtitlePath = path.join(subtitlesRoot, entry.filename);
  if (!fs.existsSync(subtitlePath)) {
    throw new Error(`Arquivo listado no manifesto não encontrado: ${subtitlePath}`);
  }
  const subtitle = fs.readFileSync(subtitlePath, "utf8");
  for (const match of subtitle.matchAll(
    /^\s*"((?:\\.|[^"])*)"\s+"((?:\\.|[^"])*)"\s*$/gm,
  )) {
    const [, token] = match;
    if (token === "Language" || token.startsWith("[english]")) continue;
    rowsByToken.set(token, match[0].trimEnd());
  }
}
function asEnglishAlias(row, token) {
  return row.replace(/^(\s*)"([^"]+)"/, `$1"[english]${token}"`);
}
announcer = announcer.replace(
  /^(\s*)"\[english\]([^"]+)"\s+"([^"]*)"\s*$/gm,
  (row, _indent, token) => {
    const translated = rowsByToken.get(token);
    return translated ? asEnglishAlias(translated, token) : row;
  },
);
const officialTokens = new Set(
  [
    ...announcer.matchAll(
      /^\s*"((?:\\.|[^"])*)"\s+"((?:\\.|[^"])*)"\s*$/gm,
    ),
  ]
    .map((match) => match[1])
    .filter((token) => token !== "Language"),
);
const announcerCatalog = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "announcer-lines.json"), "utf8"),
);
const heroCatalog = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "heroes.json"), "utf8"),
);
const voiceCatalog = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "voice-lines.json"), "utf8"),
);
for (const line of announcerCatalog.lines) {
  const row = rowsByToken.get(line.id);
  if (!row) {
    throw new Error(`Caption PT-BR ausente para o narrador: ${line.id}`);
  }
  const alias = `[english]${line.id}`;
  if (!officialTokens.has(alias)) {
    rowsByToken.set(alias, asEnglishAlias(row, line.id));
  }
}
const priorityTokens = [
  ...announcerCatalog.lines.flatMap((line) => [
    line.id,
    `[english]${line.id}`,
  ]),
  ...heroCatalog.heroes.flatMap((hero) => {
    const directory = hero.voiceDirectory || hero.id;
    return (voiceCatalog.heroes[hero.id] || []).map(
      (line) => `${directory}_${line.id}`,
    ).filter((token) => !deferredFromFunctionalAnchor.has(token));
  }),
];
const orderedTokens = [
  ...priorityTokens,
  ...rowsByToken.keys(),
];
const includedTokens = new Set(officialTokens);
const captionRows = [];
for (const token of orderedTokens) {
  if (includedTokens.has(token) || !rowsByToken.has(token)) continue;
  if (includedTokens.size >= maxAnchorTokens) break;
  includedTokens.add(token);
  captionRows.push(rowsByToken.get(token));
}

if (!captionRows.length) {
  throw new Error("Nenhum token foi encontrado no pacote gerado.");
}
const closing = /\r?\n}\r?\n}\s*$/;
if (!closing.test(announcer)) {
  throw new Error("Formato inesperado no subtitles_announcer_brazilian.txt oficial.");
}
const merged = announcer.replace(
  closing,
  `\r\n${captionRows.join("\r\n")}\r\n}\r\n}\r\n`,
);
const mergedRowsByToken = new Map(
  [
    ...merged.matchAll(
      /^\s*"((?:\\.|[^"])*)"\s+"((?:\\.|[^"])*)"\s*$/gm,
    ),
  ]
    .filter((match) => match[1] !== "Language")
    .map((match) => [match[1], match[2]]),
);
for (const line of announcerCatalog.lines) {
  const sourceRow = rowsByToken.get(line.id);
  const sourceText = sourceRow?.match(
    /^\s*"((?:\\.|[^"])*)"\s+"((?:\\.|[^"])*)"\s*$/,
  )?.[2];
  const aliasText = mergedRowsByToken.get(`[english]${line.id}`);
  if (sourceText === undefined || aliasText !== sourceText) {
    throw new Error(
      `Alias inglês sem a caption PT-BR correspondente: ${line.id}`,
    );
  }
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });
const outputFiles = [];
for (const language of outputLanguages) {
  const localized = merged.replace(
    /("Language"\s+)"[^"]+"/i,
    `$1"${language}"`,
  );
  const filename = `subtitles_announcer_${language}.txt`;
  fs.writeFileSync(path.join(outputRoot, filename), localized, "utf8");
  outputFiles.push(filename);
}
const missingPriorityTokens = priorityTokens.filter(
  (token) => rowsByToken.has(token) && !includedTokens.has(token),
);
if (missingPriorityTokens.length) {
  throw new Error(
    `A âncora não comportou ${missingPriorityTokens.length} tokens prioritários.`,
  );
}
const anchorManifest = {
  maxTokens: maxAnchorTokens,
  officialTokens: officialTokens.size,
  appendedTokens: captionRows.length,
  totalTokens: includedTokens.size,
  availableCatalogTokens: rowsByToken.size,
  announcerAliases: announcerCatalog.lines.length,
  includedEnglishAudioAliases: [...includedTokens].filter((token) =>
    token.startsWith("[english]"),
  ).length,
  outputFiles,
  omittedCatalogTokens: [...rowsByToken.keys()].filter(
    (token) => !includedTokens.has(token),
  ).length,
  bytes: Buffer.byteLength(merged),
};
fs.writeFileSync(
  outputManifestPath,
  `${JSON.stringify(anchorManifest, null, 2)}\n`,
  "utf8",
);
console.log(
  `Âncora criada com ${anchorManifest.totalTokens} tokens ` +
    `(${anchorManifest.bytes} bytes; ${anchorManifest.omittedCatalogTokens} ` +
    "permanecem nos arquivos individuais) para:",
);
console.log(outputFiles.join(", "));
