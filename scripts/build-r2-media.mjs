import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { strToU8, zipSync } from "../web/node_modules/fflate/esm/index.mjs";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(workspace, "web", "data");
const outputRoot = path.join(workspace, "build", "r2-public");
const heroes = JSON.parse(fs.readFileSync(path.join(dataRoot, "heroes.json"), "utf8"));
const voices = JSON.parse(fs.readFileSync(path.join(dataRoot, "voice-lines.json"), "utf8"));
const personas = JSON.parse(fs.readFileSync(path.join(dataRoot, "personas.json"), "utf8"));
const build = String(heroes.build.clientVersion);

function windowsText(value) {
  return strToU8(`\uFEFF${value.replace(/\r?\n/g, "\r\n")}`);
}

function required(line) {
  return Boolean(
    line.captionEn &&
    line.voiceScope !== "excluded_nonverbal" &&
    line.voiceScope !== "excluded_no_official_caption"
  );
}

function readme(hero, lines) {
  return [
    `KIT DE GRAVAÇÃO — ${hero.name.toLocaleUpperCase("pt-BR")}`,
    `Dublagem Brasileira Dota 2 · build ${build}`,
    "",
    `Grave as ${lines.length.toLocaleString("pt-BR")} falas de CHECKLIST.txt.`,
    "Salve cada WAV em wav/ usando exatamente o ID indicado.",
    "Formato: WAV PCM mono, 16-bit, 24 ou 48 kHz.",
    "Não inclua música, efeitos, áudio do jogo ou clonagem não autorizada.",
    "Um único intérprete deve gravar todo o pack.",
    "Envie somente sua voz ou uma interpretação com autorização expressa.",
    "",
  ].join("\n");
}

function checklist(hero, lines) {
  return [
    `CHECKLIST DE GRAVAÇÃO — ${hero.name.toLocaleUpperCase("pt-BR")}`,
    `Build ${build} · ${lines.length.toLocaleString("pt-BR")} falas com texto`,
    "",
    ...lines.flatMap((line) => [
      `[ ] ${line.id}`,
      `    Arquivo: wav/${line.id}.wav`,
      `    EN: ${line.captionEn.replace(/\s+/g, " ").trim()}`,
      `    PT-BR: ${(line.captionPtBr || "Tradução ainda não disponível").replace(/\s+/g, " ").trim()}`,
      "",
    ]),
  ].join("\n");
}

const kitRoot = path.join(outputRoot, "kits", `build-${build}`);
fs.mkdirSync(kitRoot, { recursive: true });
const entries = [];
const sources = [
  ...heroes.heroes.map((hero) => ({
    id: hero.id,
    name: hero.name,
    type: "hero",
    lines: voices.heroes[hero.id] || [],
  })),
  ...personas.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    type: variant.type,
    lines: variant.lines || [],
  })),
];

for (const source of sources) {
  const lines = source.lines
    .filter(required)
    .sort((left, right) => left.id.localeCompare(right.id, "en"));
  const root = `${source.id}-voice-pack`;
  const archive = zipSync({
    [`${root}/README.txt`]: windowsText(readme(source, lines)),
    [`${root}/CHECKLIST.txt`]: windowsText(checklist(source, lines)),
    [`${root}/wav/COLOQUE_OS_WAVS_AQUI.txt`]: windowsText(
      "Coloque nesta pasta um arquivo WAV para cada ID do CHECKLIST.txt.\n",
    ),
  }, { level: 6 });
  const destination = path.join(kitRoot, `${source.id}.zip`);
  fs.writeFileSync(destination, archive);
  entries.push({
    heroId: source.id,
    heroName: source.name,
    sourceType: source.type,
    key: `kits/build-${build}/${source.id}.zip`,
    lines: lines.length,
    bytes: archive.byteLength,
    sha256: crypto.createHash("sha256").update(archive).digest("hex"),
  });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  build,
  kits: entries.length,
  entries,
};
fs.writeFileSync(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `${entries.length} kits R2 gerados (${heroes.heroes.length} heróis + ${personas.variants.length} variantes) · Axe: ${entries.find((entry) => entry.heroId === "axe")?.lines} falas`,
);
console.log(outputRoot);
