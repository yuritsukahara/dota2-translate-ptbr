import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./lib/csv.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifests = [];
const heroesRoot = path.join(root, "data", "heroes");

for (const entry of fs.readdirSync(heroesRoot, { withFileTypes: true })) {
  const manifest = path.join(heroesRoot, entry.name, "lines.csv");
  if (entry.isDirectory() && fs.existsSync(manifest)) manifests.push(manifest);
}

let failures = 0;
for (const manifest of manifests) {
  const [headers, ...rows] = parseCsv(fs.readFileSync(manifest, "utf8"));
  const required = ["id", "asset_path", "category", "pt_br", "status", "actor", "license", "notes"];
  const missing = required.filter((key) => !headers.includes(key));
  if (missing.length) {
    console.error(`${manifest}: colunas ausentes: ${missing.join(", ")}`);
    failures += 1;
    continue;
  }

  const objects = rows.filter((row) => row.some(Boolean)).map((row) => Object.fromEntries(headers.map((key, i) => [key, row[i] || ""])));
  const ids = new Set();
  for (const line of objects) {
    if (!line.id || !line.asset_path || !line.pt_br || !line.status) {
      console.error(`${manifest}: linha incompleta: ${line.id || "(sem id)"}`);
      failures += 1;
    }
    if (ids.has(line.id)) {
      console.error(`${manifest}: id duplicado: ${line.id}`);
      failures += 1;
    }
    ids.add(line.id);
    if (!["placeholder", "translated", "recorded", "reviewed"].includes(line.status)) {
      console.error(`${manifest}: status inválido em ${line.id}: ${line.status}`);
      failures += 1;
    }
    if (line.status === "recorded" || line.status === "reviewed") {
      if (!line.actor || !line.license) {
        console.error(`${manifest}: gravação sem ator/licença: ${line.id}`);
        failures += 1;
      }
    }
  }
  console.log(`${path.relative(root, manifest)}: ${objects.length} linhas válidas`);
}

if (failures) process.exitCode = 1;
