import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
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

const filesByScope = new Map();
for (const line of catalog.lines) {
  if (!filesByScope.has(line.heroId)) filesByScope.set(line.heroId, []);
  filesByScope.get(line.heroId).push(path.posix.basename(line.mp3));
}
const scopes = [...filesByScope.keys()]
  .filter((scope) => /^[a-z0-9_-]+$/i.test(scope))
  .sort((left, right) => left.localeCompare(right, "en"));

const manifest = {
  generatedAt: new Date().toISOString(),
  build: "6869",
  format: "concatenated-mp3-v1",
  scopes: [],
  files: 0,
  bytes: 0,
};

async function sha256File(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

async function persistManifest() {
  await fs.writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

for (const [scopeIndex, scope] of scopes.entries()) {
  const sourceDirectory = path.join(audioRoot, scope);
  const fileNames = [...new Set(filesByScope.get(scope) || [])]
    .filter((name) => name.toLowerCase().endsWith(".mp3"))
    .sort((left, right) => left.localeCompare(right, "en"));
  for (const fileName of fileNames) {
    await fs.access(path.join(sourceDirectory, fileName));
  }
  const packPath = path.join(packsRoot, `${scope}.bin`);
  const indexPath = path.join(indexesRoot, `${scope}.json`);
  const packKey = `audio/build-6869/packs/${scope}.bin`;
  const indexKey = `audio/build-6869/indexes/${scope}.json`;
  const lineIds = fileNames.map((fileName) => fileName.slice(0, -4));

  const reusable = await Promise.all([
    fs.readFile(indexPath, "utf8").then(JSON.parse).catch(() => null),
    fs.stat(packPath).catch(() => null),
  ]).then(([index, info]) => {
    if (
      !index ||
      !info ||
      index.build !== "6869" ||
      index.scope !== scope ||
      index.packKey !== packKey
    ) {
      return null;
    }
    const indexedIds = Object.keys(index.files || {});
    const indexedBytes = Object.values(index.files || {}).reduce(
      (sum, entry) => sum + Number(entry.length || 0),
      0,
    );
    return indexedIds.length === lineIds.length &&
      lineIds.every((lineId) => index.files[lineId]) &&
      indexedBytes === info.size
      ? { index, bytes: info.size }
      : null;
  });

  if (reusable) {
    const packSha256 = await sha256File(packPath);
    const indexJson = JSON.stringify(reusable.index);
    manifest.scopes.push({
      scope,
      files: fileNames.length,
      bytes: reusable.bytes,
      packKey,
      indexKey,
      packSha256,
      indexBytes: Buffer.byteLength(indexJson),
    });
    manifest.files += fileNames.length;
    manifest.bytes += reusable.bytes;
    await persistManifest();
    process.stdout.write(
      `\r${String(scopeIndex + 1).padStart(3, " ")}/${scopes.length} · ${scope.padEnd(36, " ")} · ${fileNames.length} MP3 · reutilizado`,
    );
    continue;
  }

  const pack = await fs.open(packPath, "w");
  const packHash = createHash("sha256");
  const files = {};
  let offset = 0;

  try {
    for (let start = 0; start < fileNames.length; start += 32) {
      const batchNames = fileNames.slice(start, start + 32);
      const batch = await Promise.all(
        batchNames.map(async (fileName) => ({
          fileName,
          buffer: await fs.readFile(path.join(sourceDirectory, fileName)),
        })),
      );
      for (const { fileName, buffer } of batch) {
        const lineId = fileName.slice(0, -4);
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
  await persistManifest();
  process.stdout.write(
    `\r${String(scopeIndex + 1).padStart(3, " ")}/${scopes.length} · ${scope.padEnd(36, " ")} · ${fileNames.length} MP3`,
  );
}

await persistManifest();
process.stdout.write("\n");
console.log(
  `${manifest.files.toLocaleString("pt-BR")} MP3s empacotados em ${manifest.scopes.length} escopos · ${(manifest.bytes / 1_000_000_000).toFixed(2)} GB`,
);
