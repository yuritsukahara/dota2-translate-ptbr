import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./lib/csv.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "data", "heroes", "axe", "lines.csv");
const output = path.join(root, "web", "data", "axe-lines.json");
const [headers, ...rows] = parseCsv(fs.readFileSync(input, "utf8"));
const records = rows
  .filter((row) => row.some(Boolean))
  .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])))
  .map((line) => ({
    id: line.id,
    assetPath: line.asset_path,
    category: line.category,
    sourceText: line.source_en,
    sourceStatus: line.source_status,
    ptBrText: line.pt_br,
    translationStatus: line.status === "placeholder" ? "placeholder" : "approved",
    audioStatus: ["recorded", "reviewed"].includes(line.status) ? "recorded" : "missing",
    releaseStatus: line.status === "reviewed" ? "included" : "missing",
  }));

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`Seed web exportado: ${records.length} linhas.`);
