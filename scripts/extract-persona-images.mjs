import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dotaRoot =
  process.env.DOTA2_ROOT ||
  String.raw`C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta`;
const vpkPath = path.join(dotaRoot, "game", "dota", "pak01_dir.vpk");
const vrfCli =
  process.env.VRF_CLI ||
  path.join(root, "build", "tools", "vrf-19.2", "Source2Viewer-CLI.exe");
const mappingPath = path.join(root, "data", "persona-image-overrides.json");
const tempRoot = path.join(root, "build", "persona-image-extract");
const outputRoot = path.join(root, "web", "public", "images", "personas");

if (!fs.existsSync(vpkPath)) throw new Error(`VPK não encontrado: ${vpkPath}`);
if (!fs.existsSync(vrfCli)) {
  throw new Error(
    `Source2Viewer-CLI não encontrado: ${vrfCli}\n` +
      "Defina VRF_CLI ou instale a ferramenta local em build/tools/vrf-19.2.",
  );
}

const mappings = JSON.parse(fs.readFileSync(mappingPath, "utf8")).variants;
const resolvedTemp = path.resolve(tempRoot);
const resolvedBuild = path.resolve(root, "build");
if (!resolvedTemp.startsWith(`${resolvedBuild}${path.sep}`)) {
  throw new Error(`Diretório temporário inesperado: ${resolvedTemp}`);
}
fs.rmSync(resolvedTemp, { recursive: true, force: true });
fs.mkdirSync(resolvedTemp, { recursive: true });
fs.mkdirSync(outputRoot, { recursive: true });

const manifest = [];
const extractedAssets = new Map();
for (const [variantId, mapping] of Object.entries(mappings)) {
  let decodedPath = extractedAssets.get(mapping.asset);
  if (!decodedPath) {
    const result = spawnSync(
      vrfCli,
      [
        "-i",
        vpkPath,
        "-o",
        resolvedTemp,
        "-d",
        "-e",
        "vtex_c",
        "-f",
        mapping.asset,
      ],
      { encoding: "utf8" },
    );
    if (result.status !== 0) {
      throw new Error(
        `Falha ao extrair ${mapping.asset}\n${result.stdout}\n${result.stderr}`,
      );
    }
    decodedPath = path.join(
      resolvedTemp,
      mapping.asset.replace(/\.vtex_c$/i, ".png").replaceAll("/", path.sep),
    );
    if (!fs.existsSync(decodedPath)) {
      throw new Error(`PNG não gerado para ${mapping.asset}: ${decodedPath}`);
    }
    extractedAssets.set(mapping.asset, decodedPath);
  }

  const destination = path.join(outputRoot, `${variantId}.png`);
  fs.copyFileSync(decodedPath, destination);
  manifest.push({
    variantId,
    assetPath: mapping.asset,
    imageUrl: `/images/personas/${variantId}.png`,
    bytes: fs.statSync(destination).size,
  });
}

fs.writeFileSync(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: "Dota 2 VPK local",
      images: manifest,
    },
    null,
    2,
  )}\n`,
);

console.log(`${manifest.length} retratos extraídos para ${outputRoot}`);
