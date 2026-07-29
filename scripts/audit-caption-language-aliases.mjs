import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const captionRoot = path.join(
  root,
  "build",
  "caption-pack",
  "dota_brazilian",
);
const subtitlesRoot = path.join(captionRoot, "resource", "subtitles");
const manifestPath = path.join(captionRoot, "caption-pack-manifest.json");

if (!fs.existsSync(manifestPath) || !fs.existsSync(subtitlesRoot)) {
  throw new Error(
    "Pacote de captions ausente. Execute scripts/build-local-caption-pack.mjs primeiro.",
  );
}

const filenames = fs
  .readdirSync(subtitlesRoot)
  .filter((filename) => filename.endsWith("_brazilian.txt"))
  .sort();
const failures = [];
let normalTokens = 0;
let englishAliases = 0;

for (const filename of filenames) {
  const contents = fs.readFileSync(path.join(subtitlesRoot, filename), "utf8");
  const rows = new Map(
    [
      ...contents.matchAll(
        /^\s*"((?:\\.|[^"])*)"\s+"((?:\\.|[^"])*)"\s*$/gm,
      ),
    ]
      .filter((match) => match[1] !== "Language")
      .map((match) => [match[1], match[2]]),
  );

  for (const [token, text] of rows) {
    if (token.startsWith("[english]")) {
      englishAliases += 1;
      const normal = token.slice("[english]".length);
      if (!rows.has(normal)) {
        failures.push(`${filename}: alias sem token normal: ${token}`);
      }
      continue;
    }

    normalTokens += 1;
    const alias = `[english]${token}`;
    if (!rows.has(alias)) {
      failures.push(`${filename}: alias ausente: ${alias}`);
    } else if (rows.get(alias) !== text) {
      failures.push(`${filename}: texto divergente: ${alias}`);
    }
  }
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.files !== filenames.length) {
  failures.push(
    `Manifesto declara ${manifest.files} arquivos, mas foram encontrados ${filenames.length}.`,
  );
}
if (manifest.tokens !== normalTokens) {
  failures.push(
    `Manifesto declara ${manifest.tokens} tokens, mas foram encontrados ${normalTokens}.`,
  );
}
if (manifest.englishAudioAliases !== englishAliases) {
  failures.push(
    `Manifesto declara ${manifest.englishAudioAliases} aliases, mas foram encontrados ${englishAliases}.`,
  );
}
if (manifest.payloadEntries !== normalTokens + englishAliases) {
  failures.push(
    `Manifesto declara ${manifest.payloadEntries} entradas, mas foram encontradas ` +
      `${normalTokens + englishAliases}.`,
  );
}

if (failures.length) {
  console.error(`Falha na auditoria de aliases (${failures.length}):`);
  for (const failure of failures.slice(0, 100)) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `${filenames.length} arquivos auditados; ` +
      `${normalTokens.toLocaleString("pt-BR")} tokens normais e ` +
      `${englishAliases.toLocaleString("pt-BR")} aliases [english] pareados.`,
  );
}
