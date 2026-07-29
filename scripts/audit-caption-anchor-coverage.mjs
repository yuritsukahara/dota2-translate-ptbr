import fs from "node:fs";
import path from "node:path";
import { listVpkEntries, readVpkEntryRecord } from "./lib/vpk.mjs";

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

const [vpkArgument, subtitlesArgument] = process.argv.slice(2);
if (!vpkArgument || !subtitlesArgument) {
  throw new Error(
    "Uso: node scripts/audit-caption-anchor-coverage.mjs " +
      "<pak01_dir.vpk funcional> <diretório de subtitles gerados>",
  );
}

const vpkPath = path.resolve(vpkArgument);
const subtitlesRoot = path.resolve(subtitlesArgument);
const individualFiles = collectFiles(subtitlesRoot)
  .filter((file) => /_brazilian\.txt$/i.test(file))
  .filter((file) => !/subtitles_announcer(?:_killing_spree)?_brazilian\.txt$/i.test(file))
  .sort((left, right) => left.localeCompare(right));

const desired = new Map();
const duplicateDesired = [];
for (const file of individualFiles) {
  for (const [token, row] of parseRows(fs.readFileSync(file), file)) {
    const existing = desired.get(token);
    if (existing && existing.value !== row.value) {
      duplicateDesired.push({
        token,
        previousSource: existing.source,
        source: row.source,
      });
    }
    desired.set(token, row);
  }
}

const anchorPattern =
  /^resource\/subtitles\/subtitles_announcer(?:_killing_spree)?_(?:brazilian|english|russian)\.txt$/i;
const anchorEntries = listVpkEntries(vpkPath)
  .filter((entry) => anchorPattern.test(entry.path))
  .sort((left, right) => left.path.localeCompare(right.path));
const anchors = anchorEntries.map((entry) => ({
  path: entry.path,
  rows: parseRows(readVpkEntryRecord(vpkPath, entry), entry.path),
}));

const baselineUnion = new Map();
for (const anchor of anchors) {
  for (const [token, row] of anchor.rows) baselineUnion.set(token, row);
}

let exactInAnyAnchor = 0;
let exactInUnion = 0;
let absentFromUnion = 0;
let differentInUnion = 0;
const requiredAgainstUnion = [];
for (const [token, row] of desired) {
  const exactSomewhere = anchors.some(
    (anchor) => anchor.rows.get(token)?.value === row.value,
  );
  if (exactSomewhere) exactInAnyAnchor += 1;
  const baseline = baselineUnion.get(token);
  if (!baseline) absentFromUnion += 1;
  else if (baseline.value !== row.value) differentInUnion += 1;
  else exactInUnion += 1;
  if (!baseline || baseline.value !== row.value) requiredAgainstUnion.push(row);
}

const byNamespace = new Map();
for (const token of desired.keys()) {
  const normalized = token.startsWith("[english]")
    ? token.slice("[english]".length)
    : token;
  const namespace = normalized.split("_", 1)[0];
  const current = byNamespace.get(namespace) || {
    total: 0,
    normal: 0,
    englishAlias: 0,
  };
  current.total += 1;
  if (token.startsWith("[english]")) current.englishAlias += 1;
  else current.normal += 1;
  byNamespace.set(namespace, current);
}

const report = {
  vpkPath,
  subtitlesRoot,
  individualFiles: individualFiles.length,
  desiredTokens: desired.size,
  desiredNormalTokens: [...desired.keys()].filter(
    (token) => !token.startsWith("[english]"),
  ).length,
  desiredEnglishAliases: [...desired.keys()].filter((token) =>
    token.startsWith("[english]"),
  ).length,
  duplicateDesiredTokensWithDifferentText: duplicateDesired.length,
  anchors: anchors.map((anchor) => ({
    path: anchor.path,
    tokens: anchor.rows.size,
  })),
  baselineUnionTokens: baselineUnion.size,
  exactInAnyAnchor,
  exactInUnion,
  absentFromUnion,
  differentInUnion,
  requiredAgainstUnion: requiredAgainstUnion.length,
  supplementalCapacityAt55000Each: 110_000,
  fitsTwoSupplementalAnchors: requiredAgainstUnion.length <= 110_000,
  namespaces: Object.fromEntries(
    [...byNamespace.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  ),
};

console.log(JSON.stringify(report, null, 2));
