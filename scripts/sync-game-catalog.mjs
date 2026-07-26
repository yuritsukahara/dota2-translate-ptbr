import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseCsv, stringifyCsv } from "./lib/csv.mjs";
import { listVpkEntries, readVpkEntry } from "./lib/vpk.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argument = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const defaultDota = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta";
const dotaRoot = argument("--dota", process.env.DOTA2_ROOT || defaultDota);
const vpkPath = argument(
  "--vpk",
  path.join(dotaRoot, "game", "dota", "pak01_dir.vpk")
);
const entries = listVpkEntries(vpkPath);
const entryPaths = new Set(entries.map((entry) => entry.path));

function parseValveTokens(buffer) {
  const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return new Map(
    [...source.matchAll(/^\s*"([^"]+)"\s+"((?:[^"\\]|\\.)*)"/gm)]
      .filter(([, key]) => key !== "Language")
      .map(([, key, value]) => [
        key,
        value.replace(/\\"/g, '"').replace(/\\n/g, "\n"),
      ])
  );
}

function readBuild() {
  const steamInfo = path.join(dotaRoot, "game", "dota", "steam.inf");
  if (!fs.existsSync(steamInfo)) return { clientVersion: "desconhecido", date: "" };
  const values = Object.fromEntries(
    fs
      .readFileSync(steamInfo, "utf8")
      .split(/\r?\n/)
      .map((line) => line.split("=", 2))
      .filter((parts) => parts.length === 2)
  );
  return {
    clientVersion: values.ClientVersion || "desconhecido",
    date: values.VersionDate || "",
  };
}

const response = await fetch("https://api.opendota.com/api/heroStats", {
  headers: { "user-agent": "dota2-translate-ptbr-catalog/0.1" },
});
if (!response.ok) {
  throw new Error(`OpenDota respondeu ${response.status}.`);
}
const openDotaHeroes = await response.json();

const imageBase = "https://cdn.cloudflare.steamstatic.com";
const build = readBuild();
const heroes = openDotaHeroes
  .map((hero) => {
    const slug = hero.name.replace(/^npc_dota_hero_/, "");
    const assetPrefix = `sounds/vo/${slug}/${slug}_`;
    const total = slug === "axe" ? entries.filter(
      (entry) =>
        entry.path.startsWith(assetPrefix) && entry.path.endsWith(".vsnd_c")
    ).length : 0;
    const subtitlePath = `resource/subtitles/subtitles_${slug}_english.txt`;
    return {
      id: slug,
      dotaId: hero.id,
      name: hero.localized_name,
      imageUrl: `${imageBase}${hero.img}`,
      iconUrl: `${imageBase}${hero.icon}`,
      primaryAttribute: hero.primary_attr,
      attackType: hero.attack_type,
      roles: hero.roles,
      total,
      assetTotal: total,
      drafted: 0,
      translated: 0,
      recorded: 0,
      reviewed: 0,
      hasOfficialEnglishCaptions: entryPaths.has(subtitlePath),
      active: slug === "axe",
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

const axeCsvPath = path.join(root, "data", "heroes", "axe", "lines.csv");
const [oldHeaders, ...oldRows] = parseCsv(fs.readFileSync(axeCsvPath, "utf8"));
const oldLines = oldRows
  .filter((row) => row.some(Boolean))
  .map((row) =>
    Object.fromEntries(oldHeaders.map((header, index) => [header, row[index] || ""]))
  );
const axeDrafts = JSON.parse(
  fs.readFileSync(
    path.join(root, "data", "heroes", "axe", "spoken-ptbr.json"),
    "utf8"
  )
);
const axeNonverbal = JSON.parse(
  fs.readFileSync(
    path.join(root, "data", "heroes", "axe", "nonverbal.json"),
    "utf8"
  )
);
const axeCaptions = parseValveTokens(
  readVpkEntry(vpkPath, "resource/subtitles/subtitles_axe_english.txt")
);
const directAxeCaptions = new Map(
  [...axeCaptions]
    .filter(([key]) => key.startsWith("axe_axe_"))
    .map(([key, value]) => [key.replace(/^axe_axe_/, "axe_"), value])
);
const headers = [
  "id",
  "asset_path",
  "category",
  "source_en",
  "source_status",
  "voice_scope",
  "voice_direction",
  "pt_br",
  "status",
  "actor",
  "license",
  "notes",
];

function voiceDirection(category) {
  if (/^(ability|attack|battlebegins|blinkcull|cast|firstblood|kill)/.test(category)) {
    return "guerreiro brutal; agressivo; projeção forte; ritmo rápido";
  }
  if (/^(ally|deny|rival|thanks)/.test(category)) {
    return "provocador; arrogante; humor seco; ritmo conversado";
  }
  if (/^(death|lose)/.test(category)) {
    return "derrotado; pesado; intensidade decrescente";
  }
  if (/^(respawn|spawn|win|level)/.test(category)) {
    return "triunfante; confiante; voz aberta e energética";
  }
  if (/^(move|missing_lane|nomana|notyet|underattack)/.test(category)) {
    return "comando curto; direto; leitura clara";
  }
  return "voz grave; confiante; personagem guerreiro; dicção clara";
}

const axeRows = oldLines.map((line) =>
  headers.map((header) => {
    if (header === "source_en") return directAxeCaptions.get(line.id) || "";
    if (header === "source_status") {
      return directAxeCaptions.has(line.id)
        ? "official_caption"
        : "missing_official_caption";
    }
    if (header === "voice_scope") {
      if (!directAxeCaptions.has(line.id)) return "excluded_no_official_caption";
      if (axeNonverbal[line.id]) return "excluded_nonverbal";
      if (axeDrafts[line.id]) return "spoken";
      return "unclassified";
    }
    if (header === "voice_direction") {
      return axeDrafts[line.id] ? voiceDirection(line.category) : "";
    }
    if (header === "pt_br" && axeDrafts[line.id]) return axeDrafts[line.id];
    if (header === "pt_br" && axeNonverbal[line.id]) return "";
    if (header === "pt_br" && !directAxeCaptions.has(line.id)) return "";
    if (header === "notes" && axeDrafts[line.id] && !line.notes) {
      return "Rascunho-guia baseado na legenda oficial EN; requer revisão comunitária.";
    }
    return line[header] || "";
  })
);
fs.writeFileSync(
  axeCsvPath,
  stringifyCsv([headers, ...axeRows]),
  "utf8"
);

const axe = heroes.find((hero) => hero.id === "axe");
if (axe) {
  const statusIndex = headers.indexOf("status");
  axe.assetTotal = axeRows.length;
  axe.total = Object.keys(axeDrafts).length;
  axe.drafted = Object.keys(axeDrafts).length;
  axe.translated = axeRows.filter(
    (row) => ["translated", "recorded", "reviewed"].includes(row[statusIndex])
  ).length;
  axe.recorded = axeRows.filter((row) =>
    ["recorded", "reviewed"].includes(row[statusIndex])
  ).length;
  axe.reviewed = axeRows.filter((row) => row[statusIndex] === "reviewed").length;
}

const output = path.join(root, "web", "data", "heroes.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(
  output,
  `${JSON.stringify(
    {
      source: "OpenDota heroStats + VPK local",
      build,
      generatedAt: new Date().toISOString(),
      heroes,
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(
  `Catálogo: ${heroes.length} heróis; Axe é o inventário base reconciliado desta etapa.`
);
console.log(
  `Axe: ${axeRows.length} assets, ${Object.keys(axeDrafts).length} falas verbais traduzidas, ${Object.keys(axeNonverbal).length} não verbais excluídas, build ${build.clientVersion}.`
);
