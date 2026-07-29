import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(root, "web", "data");
const defaultEventsRoot = path.join(
  root,
  "build",
  "caption-event-analysis",
  "soundevents",
  "voscripts",
);
const eventsRoot = path.resolve(process.argv[2] || defaultEventsRoot);
const outputPath = path.join(root, "build", "decompiled-voice-event-audit.json");

function collectFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(absolutePath));
    else if (entry.isFile() && /\.vsndevts$/i.test(entry.name)) {
      files.push(absolutePath);
    }
  }
  return files;
}

function parseVoiceEvents(file) {
  const source = fs.readFileSync(file, "utf8");
  const events = [];
  const blockPattern =
    /^\s*([a-z0-9_]+)\s*=\s*\r?\n\s*\{\r?\n([\s\S]*?)^\s*\}\s*$/gim;
  for (const match of source.matchAll(blockPattern)) {
    const body = match[2];
    if (!/\btype\s*=\s*"dota_update_vo_switch"/i.test(body)) continue;
    const sound = body.match(/\bvsnd_files\s*=\s*"([^"]+)"/i)?.[1] || null;
    events.push({
      token: match[1],
      sound,
      source: path.relative(eventsRoot, file).replaceAll("\\", "/"),
    });
  }
  return events;
}

if (!fs.existsSync(eventsRoot)) {
  throw new Error(`Diretório descompilado não encontrado: ${eventsRoot}`);
}

const eventFiles = collectFiles(eventsRoot).sort((left, right) =>
  left.localeCompare(right),
);
const eventByToken = new Map();
const duplicateEvents = [];
for (const file of eventFiles) {
  for (const event of parseVoiceEvents(file)) {
    if (eventByToken.has(event.token)) {
      duplicateEvents.push({
        token: event.token,
        first: eventByToken.get(event.token),
        second: event,
      });
    } else {
      eventByToken.set(event.token, event);
    }
  }
}

const heroes = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "heroes.json"), "utf8"),
).heroes;
const voiceLines = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "voice-lines.json"), "utf8"),
).heroes;
const variants = JSON.parse(
  fs.readFileSync(path.join(dataRoot, "personas.json"), "utf8"),
).variants;

const expected = [];
for (const hero of heroes) {
  const directory = hero.voiceDirectory || hero.id;
  for (const line of voiceLines[hero.id] || []) {
    expected.push({
      heroId: hero.id,
      ownerId: hero.id,
      kind: "base",
      lineId: line.id,
      token: `${directory}_${line.id}`,
      expectedSound: `sounds/vo/${directory}/${line.id}.vsnd`,
    });
  }
  for (const variant of variants.filter((entry) => entry.heroId === hero.id)) {
    for (const line of variant.lines || []) {
      expected.push({
        heroId: hero.id,
        ownerId: variant.id,
        kind: variant.kind || "variant",
        lineId: line.id,
        token: `${directory}_${line.id}`,
        expectedSound: `sounds/vo/${directory}/${line.id}.vsnd`,
      });
    }
  }
}

const missingEvents = [];
const soundMismatches = [];
const coverageByOwner = new Map();
for (const item of expected) {
  const current = coverageByOwner.get(item.ownerId) || {
    heroId: item.heroId,
    ownerId: item.ownerId,
    kind: item.kind,
    expected: 0,
    matched: 0,
    missing: 0,
    soundMismatches: 0,
  };
  current.expected += 1;
  const event = eventByToken.get(item.token);
  if (!event) {
    current.missing += 1;
    missingEvents.push(item);
  } else if (event.sound?.toLowerCase() !== item.expectedSound.toLowerCase()) {
    current.soundMismatches += 1;
    soundMismatches.push({ ...item, actualSound: event.sound, event });
  } else {
    current.matched += 1;
  }
  coverageByOwner.set(item.ownerId, current);
}

const report = {
  generatedAt: new Date().toISOString(),
  eventsRoot,
  eventFiles: eventFiles.length,
  parsedVoiceEvents: eventByToken.size,
  expectedCatalogLines: expected.length,
  matchedCatalogLines:
    expected.length - missingEvents.length - soundMismatches.length,
  duplicateEvents: duplicateEvents.length,
  missingEvents: missingEvents.length,
  soundMismatches: soundMismatches.length,
  owners: [...coverageByOwner.values()].sort(
    (left, right) =>
      left.heroId.localeCompare(right.heroId) ||
      left.ownerId.localeCompare(right.ownerId),
  ),
  missingEventDetails: missingEvents,
  soundMismatchDetails: soundMismatches,
  duplicateEventDetails: duplicateEvents,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  `${report.matchedCatalogLines.toLocaleString("pt-BR")} de ` +
    `${report.expectedCatalogLines.toLocaleString("pt-BR")} linhas ligadas ` +
    `ao evento e ao áudio descompilados; ${report.missingEvents} eventos ` +
    `ausentes; ${report.soundMismatches} caminhos divergentes.`,
);
console.log(outputPath);
if (
  report.missingEvents ||
  report.soundMismatches ||
  report.duplicateEvents
) {
  process.exitCode = 1;
}
