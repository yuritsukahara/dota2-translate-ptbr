import fs from "node:fs";
import path from "node:path";
import { readVpkEntry } from "./lib/vpk.mjs";

const workspace = path.resolve(import.meta.dirname, "..");
const suggestionsPath = path.join(
  workspace,
  "web/data/automatic-translations.json",
);
const defaultVpk =
  "C:/Program Files (x86)/Steam/steamapps/common/dota 2 beta/game/dota/pak01_dir.vpk";
const vpkPath = process.argv[2] || process.env.DOTA_VPK_PATH || defaultVpk;

function parseTokens(file) {
  const source = readVpkEntry(vpkPath, file).toString("utf8").replace(/^\uFEFF/, "");
  return new Map(
    [...source.matchAll(/^\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"/gm)]
      .map((match) => [match[1], match[2].replaceAll('\\"', '"')]),
  );
}

function category(id) {
  if (/tower/i.test(id)) return "torres";
  if (/barracks/i.test(id)) return "quartéis";
  if (/courier/i.test(id)) return "mensageiro";
  if (/roshan/i.test(id)) return "roshan";
  if (/victory|defeat|win|lose/i.test(id)) return "resultado";
  if (/firstblood|kill/i.test(id)) return "abates";
  if (/radiant|dire/i.test(id)) return "equipes";
  return "partida";
}

const regularEnglish = parseTokens("resource/subtitles/subtitles_announcer_english.txt");
const killingSpreeEnglish = parseTokens(
  "resource/subtitles/subtitles_announcer_killing_spree_english.txt",
);
const english = new Map([...regularEnglish, ...killingSpreeEnglish]);
const brazilian = parseTokens("resource/subtitles/subtitles_announcer_brazilian.txt");
const suggestions = fs.existsSync(suggestionsPath)
  ? JSON.parse(fs.readFileSync(suggestionsPath, "utf8")).translations
      ?.announcer || {}
  : {};
const lines = [...english]
  .filter(([id, caption]) => id && caption && id.toLowerCase() !== "language")
  .map(([id, captionEn]) => {
    const official = brazilian.get(id) || null;
    const suggested = suggestions[id] || null;
    return {
      id,
      category: category(id),
      captionEn,
      captionPtBr: official || suggested,
      captionPtBrSource: official
        ? "official"
        : suggested
          ? "automatic"
          : null,
    };
  })
  .sort((left, right) => left.id.localeCompare(right.id, "en"));

const output = {
  source: [
    "resource/subtitles/subtitles_announcer_{english,brazilian}.txt",
    "resource/subtitles/subtitles_announcer_killing_spree_english.txt",
  ],
  generatedAt: new Date().toISOString(),
  lines,
};
fs.writeFileSync(
  path.join(workspace, "web/data/announcer-lines.json"),
  `${JSON.stringify(output, null, 2)}\n`,
);
console.log(
  `Narrador padrão: ${lines.length} captions EN; ${lines.filter((line) => line.captionPtBr).length} captions oficiais PT-BR.`,
);
