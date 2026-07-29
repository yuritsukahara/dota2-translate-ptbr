import fs from "node:fs";
import path from "node:path";
import { listVpkEntries, readVpkEntryRecord } from "./lib/vpk.mjs";

const MAX_TOKENS = Number(process.env.CAPTION_ANCHOR_MAX_TOKENS || 55_000);

function parseRows(buffer, source) {
  const text = Buffer.isBuffer(buffer) ? buffer.toString("utf8") : String(buffer);
  const rows = new Map();
  for (const match of text.matchAll(
    /^\s*"([^"]+)"\s+"((?:\\.|[^"])*)"\s*$/gm,
  )) {
    if (match[1] === "Language") continue;
    rows.set(match[1], {
      token: match[1],
      value: match[2],
      row: `\t\t"${match[1]}"\t\t"${match[2]}"`,
      source,
    });
  }
  return rows;
}

function collectFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(absolutePath));
    else if (entry.isFile()) files.push(absolutePath);
  }
  return files;
}

function render(language, rows) {
  return [
    '"lang"',
    "{",
    `\t"Language"\t\t"${language}"`,
    '\t"Tokens"',
    "\t{",
    ...rows.map((row) => row.row),
    "\t}",
    "}",
    "",
  ].join("\r\n");
}

const [vpkArgument, subtitlesArgument, outputArgument] = process.argv.slice(2);
if (!vpkArgument || !subtitlesArgument || !outputArgument) {
  throw new Error(
    "Uso: node scripts/build-caption-compatibility-overlay.mjs " +
      "<pak01_dir.vpk funcional> <diretório de subtitles gerados> " +
      "<diretório de saída>",
  );
}

const vpkPath = path.resolve(vpkArgument);
const subtitlesRoot = path.resolve(subtitlesArgument);
const outputRoot = path.resolve(outputArgument);
const overlayRoot = path.join(outputRoot, "overlay");
const outputSubtitles = path.join(overlayRoot, "resource", "subtitles");
const individualFiles = collectFiles(subtitlesRoot)
  .filter((file) => /_brazilian\.txt$/i.test(file))
  .filter((file) => !/subtitles_announcer(?:_killing_spree)?_brazilian\.txt$/i.test(file))
  .sort((left, right) => left.localeCompare(right));

const desired = new Map();
for (const file of individualFiles) {
  for (const [token, row] of parseRows(fs.readFileSync(file), file)) {
    const existing = desired.get(token);
    if (existing && existing.value !== row.value) {
      throw new Error(
        `Token com duas traduções divergentes: ${token}\n` +
          `${existing.source}\n${row.source}`,
      );
    }
    desired.set(token, row);
  }
}

const anchorPattern =
  /^resource\/subtitles\/subtitles_announcer(?:_killing_spree)?_(?:brazilian|english|russian)\.txt$/i;
const baseline = new Map();
const baselineAnchors = listVpkEntries(vpkPath)
  .filter((entry) => anchorPattern.test(entry.path))
  .sort((left, right) => left.path.localeCompare(right.path));
for (const entry of baselineAnchors) {
  for (const [token, row] of parseRows(
    readVpkEntryRecord(vpkPath, entry),
    entry.path,
  )) {
    baseline.set(token, row);
  }
}

const requiredNormal = [];
const requiredEnglishAliases = [];
for (const [token, row] of desired) {
  if (baseline.get(token)?.value === row.value) continue;
  if (token.startsWith("[english]")) requiredEnglishAliases.push(row);
  else requiredNormal.push(row);
}
requiredNormal.sort((left, right) => left.token.localeCompare(right.token));
requiredEnglishAliases.sort((left, right) =>
  left.token.localeCompare(right.token),
);

if (requiredNormal.length > MAX_TOKENS) {
  throw new Error(
    `${requiredNormal.length} tokens normais excedem o limite de ${MAX_TOKENS}.`,
  );
}

const brazilianRows = [
  ...requiredNormal,
  ...requiredEnglishAliases.slice(0, MAX_TOKENS - requiredNormal.length),
];
const englishRows = requiredEnglishAliases.slice(
  MAX_TOKENS - requiredNormal.length,
);
if (englishRows.length > MAX_TOKENS) {
  throw new Error(
    `${englishRows.length} aliases restantes excedem o limite de ${MAX_TOKENS}.`,
  );
}

fs.mkdirSync(outputSubtitles, { recursive: true });
const brazilianPath = path.join(
  outputSubtitles,
  "subtitles_announcer_killing_spree_brazilian.txt",
);
const englishPath = path.join(
  outputSubtitles,
  "subtitles_announcer_killing_spree_english.txt",
);
for (const outputPath of [brazilianPath, englishPath]) {
  if (fs.existsSync(outputPath)) fs.rmSync(outputPath);
}
fs.writeFileSync(brazilianPath, render("brazilian", brazilianRows), "utf8");
fs.writeFileSync(englishPath, render("English", englishRows), "utf8");

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  baselineVpk: vpkPath,
  subtitlesRoot,
  maxTokensPerSupplementalAnchor: MAX_TOKENS,
  individualFiles: individualFiles.length,
  desired: {
    total: desired.size,
    normal: [...desired.keys()].filter(
      (token) => !token.startsWith("[english]"),
    ).length,
    englishAliases: [...desired.keys()].filter((token) =>
      token.startsWith("[english]"),
    ).length,
  },
  baseline: {
    anchors: baselineAnchors.map((entry) => entry.path),
    unionTokens: baseline.size,
  },
  supplemental: {
    requiredNormal: requiredNormal.length,
    requiredEnglishAliases: requiredEnglishAliases.length,
    total: requiredNormal.length + requiredEnglishAliases.length,
    files: [
      {
        path: path.relative(overlayRoot, brazilianPath).replaceAll("\\", "/"),
        tokens: brazilianRows.length,
        normal: brazilianRows.filter(
          (row) => !row.token.startsWith("[english]"),
        ).length,
        englishAliases: brazilianRows.filter((row) =>
          row.token.startsWith("[english]"),
        ).length,
      },
      {
        path: path.relative(overlayRoot, englishPath).replaceAll("\\", "/"),
        tokens: englishRows.length,
        normal: englishRows.filter(
          (row) => !row.token.startsWith("[english]"),
        ).length,
        englishAliases: englishRows.filter((row) =>
          row.token.startsWith("[english]"),
        ).length,
      },
    ],
  },
};
fs.writeFileSync(
  path.join(outputRoot, "caption-compatibility-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `${manifest.supplemental.total.toLocaleString("pt-BR")} tokens ` +
    `complementares gerados em ${manifest.supplemental.files.length} tabelas.`,
);
for (const file of manifest.supplemental.files) {
  console.log(
    `${file.path}: ${file.tokens.toLocaleString("pt-BR")} ` +
      `(${file.normal.toLocaleString("pt-BR")} normais; ` +
      `${file.englishAliases.toLocaleString("pt-BR")} aliases)`,
  );
}
