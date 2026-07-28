import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsv } from "./lib/csv.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.join(root, "data", "heroes", "axe", "lines.csv");
const output = path.join(root, "web", "data", "voice-lines.json");
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
    voiceScope: line.voice_scope,
    voiceDirection: line.voice_direction,
    ptBrText: line.pt_br,
    translationStatus: line.status === "placeholder" ? "placeholder" : "approved",
    audioStatus: ["recorded", "reviewed"].includes(line.status) ? "recorded" : "missing",
  }));

if (!fs.existsSync(output)) {
  throw new Error("Catálogo geral ausente. Execute primeiro sync-official-voice-catalog.mjs.");
}

const catalog = JSON.parse(fs.readFileSync(output, "utf8"));
const draftsById = new Map(records.map((line) => [line.id, line]));
let incorporated = 0;
let translated = 0;
catalog.heroes.axe = (catalog.heroes.axe || []).map((line) => {
  const draft = draftsById.get(line.id);
  if (!draft) return line;
  incorporated += 1;
  const hasOfficialTranslation =
    Boolean(line.captionPtBr) && line.captionPtBrSource !== "community";
  const hasCommunityTranslation =
    !hasOfficialTranslation &&
    draft.voiceScope === "spoken" &&
    Boolean(draft.ptBrText);
  if (hasCommunityTranslation) translated += 1;
  return {
    ...line,
    captionPtBr: hasCommunityTranslation ? draft.ptBrText : line.captionPtBr,
    captionPtBrSource: hasOfficialTranslation
      ? "official"
      : hasCommunityTranslation
        ? "community"
        : null,
    sourceStatus: draft.sourceStatus,
    voiceScope: draft.voiceScope,
    voiceDirection: draft.voiceDirection,
    translationStatus: draft.translationStatus,
    audioStatus: draft.audioStatus,
  };
});

fs.writeFileSync(output, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(
  `Axe incorporado ao catálogo geral: ${incorporated} linhas, ${translated} traduções comunitárias.`,
);
