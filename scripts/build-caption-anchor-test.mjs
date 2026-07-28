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
const manifestPath = path.join(captionPackRoot, "caption-pack-manifest.json");
const subtitlesRoot = path.join(captionPackRoot, "resource", "subtitles");
const outputRoot = path.join(
  root,
  "build",
  "caption-anchor-test",
  "resource",
  "subtitles",
);
const outputPath = path.join(outputRoot, "subtitles_announcer_brazilian.txt");

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
  for (const match of subtitle.matchAll(/^\s*"([^"]+)"\s+"([^"]*)"\s*$/gm)) {
    const [, token] = match;
    if (token === "Language") continue;
    rowsByToken.set(token, match[0].trimEnd());
  }
}
const captionRows = [...rowsByToken.values()].join("\r\n");

if (!captionRows) {
  throw new Error("Nenhum token foi encontrado no pacote gerado.");
}
const closing = /\r?\n}\r?\n}\s*$/;
if (!closing.test(announcer)) {
  throw new Error("Formato inesperado no subtitles_announcer_brazilian.txt oficial.");
}
const merged = announcer.replace(
  closing,
  `\r\n${captionRows}\r\n}\r\n}\r\n`,
);

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(outputPath, merged, "utf8");
console.log(`Âncora criada com ${rowsByToken.size} tokens do pacote:`);
console.log(outputPath);
