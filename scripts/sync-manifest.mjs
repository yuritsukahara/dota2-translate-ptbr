import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseCsv, stringifyCsv } from "./lib/csv.mjs";
import { listVpkEntries } from "./lib/vpk.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argument = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const hero = argument("--hero", "axe").toLowerCase();
const defaultDota = "C:\\Program Files (x86)\\Steam\\steamapps\\common\\dota 2 beta";
const dotaRoot = argument("--dota", process.env.DOTA2_ROOT || defaultDota);
const vpkPath = argument("--vpk", path.join(dotaRoot, "game", "dota", "pak01_dir.vpk"));
const outputPath = path.join(repoRoot, "data", "heroes", hero, "lines.csv");

const escapedHero = hero.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pattern = new RegExp(`^sounds/vo/${escapedHero}/${escapedHero}_.+\\.vsnd_c$`);
const assets = listVpkEntries(vpkPath)
  .map((entry) => entry.path)
  .filter((entryPath) => pattern.test(entryPath))
  .sort();

if (!assets.length) {
  throw new Error(`Nenhuma fala encontrada para '${hero}' em ${vpkPath}`);
}

const existing = new Map();
if (fs.existsSync(outputPath)) {
  const [headers, ...rows] = parseCsv(fs.readFileSync(outputPath, "utf8"));
  const assetIndex = headers.indexOf("asset_path");
  for (const row of rows) existing.set(row[assetIndex], Object.fromEntries(headers.map((key, i) => [key, row[i] || ""])));
}

const categoryLabel = {
  ability_battlehunger: "fome de batalha",
  ability_berserk: "chamado do berserker",
  ability_cullingblade: "lâmina de abate",
  ability_failure: "habilidade falhou",
  ally: "interação com aliado",
  anger: "raiva",
  attack: "ataque",
  battlebegins: "início da batalha",
  blink: "adaga de translocação",
  blinkcull: "translocação e abate",
  bottle: "garrafa",
  cast: "conjuração",
  death: "morte",
  deny: "negação",
  doubdam: "dano dobrado",
  firstblood: "primeiro sangue",
  happy: "felicidade",
  haste: "velocidade",
  illus: "ilusão",
  immort: "égide",
  invis: "invisibilidade",
  item: "item",
  kill: "abate",
  killspecial: "abate especial",
  lasthit: "último golpe",
  laugh: "risada",
  level: "novo nível",
  lose: "derrota",
  missing_lane: "inimigo desaparecido",
  move: "movimento",
  nomana: "sem mana",
  notyet: "ainda não",
  pain: "dor",
  purch: "compra",
  rare: "item raro",
  regen: "regeneração",
  respawn: "renascimento",
  rival: "interação com rival",
  sheepstick: "transformação",
  spawn: "entrada",
  thanks: "agradecimento",
  underattack: "sob ataque",
  win: "vitória"
};

const headers = ["id", "asset_path", "category", "pt_br", "status", "actor", "license", "notes"];
const rows = assets.map((assetPath) => {
  const id = path.posix.basename(assetPath, ".vsnd_c");
  const match = id.match(new RegExp(`^${escapedHero}_(.+?)_(\\d+)(?:_(\\d+))?$`));
  const category = match?.[1] || "misc";
  const number = match?.[2] || "01";
  const old = existing.get(assetPath) || {};
  const placeholder = `${hero === "axe" ? "Axe" : hero}: ${categoryLabel[category] || category.replaceAll("_", " ")}, fala ${Number(number)}.`;
  return headers.map((header) => {
    if (header === "id") return id;
    if (header === "asset_path") return assetPath;
    if (header === "category") return category;
    if (header === "pt_br") return old.pt_br || placeholder;
    if (header === "status") return old.status || "placeholder";
    return old[header] || "";
  });
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, stringifyCsv([headers, ...rows]), "utf8");
console.log(`Manifesto atualizado: ${assets.length} assets em ${path.relative(repoRoot, outputPath)}`);
