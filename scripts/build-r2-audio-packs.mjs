import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const audioRoot = path.join(root, "build", "local-audio", "mp3");
const catalogPath = path.join(root, "build", "local-audio", "catalog.json");
const outputRoot = path.join(root, "build", "r2-audio", "build-6869");
const packsRoot = path.join(outputRoot, "packs");
const indexesRoot = path.join(outputRoot, "indexes");

const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const shaByRelativePath = new Map(
  catalog.lines.map((line) => [
    String(line.mp3).replaceAll("\\", "/"),
    line.sha256,
  ]),
);

await fs.mkdir(packsRoot, { recursive: true });
await fs.mkdir(indexesRoot, { recursive: true });

const scopes = (await fs.readdir(audioRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && /^[a-z0-9_-]+$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((left, right) => left.localeCompare(right, "en"));

const manifest = {
  generatedAt: new Date().toISOString(),
  build: "6869",
  format: "concatenated-mp3-v1",
  scopes: [],
  files: 0,
  bytes: 0,
};

for (const [scopeIndex, scope] of scopes.entries()) {
  const sourceDirectory = path.join(audioRoot, scope);
  const fileNames = (await fs.readdir(sourceDirectory))
    .filter((name) => name.toLowerCase().endsWith(".mp3"))
    .sort((left, right) => left.localeCompare(right, "en"));
  const packPath = path.join(packsRoot, `${scope}.bin`);
  const indexPath = path.join(indexesRoot, `${scope}.json`);
  const packKey = `audio/build-6869/packs/${scope}.bin`;
  const indexKey = `audio/build-6869/indexes/${scope}.json`;
  const pack = await fs.open(packPath, "w");
  const packHash = createHash("sha256");
  const files = {};
  let offset = 0;

  try {
    for (const fileName of fileNames) {
      const lineId = fileName.slice(0, -4);
      const sourcePath = path.join(sourceDirectory, fileName);
      const buffer = await fs.readFile(sourcePath);
      await pack.write(buffer, 0, buffer.length, offset);
      packHash.update(buffer);
      const relativePath = `mp3/${scope}/${fileName}`;
      files[lineId] = {
        offset,
        length: buffer.length,
        sha256:
          shaByRelativePath.get(relativePath) ||
          createHash("sha256").update(buffer).digest("hex"),
      };
      offset += buffer.length;
    }
    await pack.sync();
  } finally {
    await pack.close();
  }

  const index = {
    build: "6869",
    scope,
    packKey,
    files,
  };
  const indexJson = JSON.stringify(index);
  await fs.writeFile(indexPath, indexJson);

  manifest.scopes.push({
    scope,
    files: fileNames.length,
    bytes: offset,
    packKey,
    indexKey,
    packSha256: packHash.digest("hex"),
    indexBytes: Buffer.byteLength(indexJson),
  });
  manifest.files += fileNames.length;
  manifest.bytes += offset;
  process.stdout.write(
    `\r${String(scopeIndex + 1).padStart(3, " ")}/${scopes.length} · ${scope.padEnd(36, " ")} · ${fileNames.length} MP3`,
  );
}

await fs.writeFile(
  path.join(outputRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
process.stdout.write("\n");
console.log(
  `${manifest.files.toLocaleString("pt-BR")} MP3s empacotados em ${manifest.scopes.length} escopos · ${(manifest.bytes / 1_000_000_000).toFixed(2)} GB`,
);
