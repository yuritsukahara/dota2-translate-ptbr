import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const requireFromWeb = createRequire(path.join(repositoryRoot, "web", "package.json"));
const sharp = requireFromWeb("sharp");

const source = path.join(repositoryRoot, "web", "public", "favicon.svg");
const destination = path.join(
  repositoryRoot,
  "installer",
  "DublagemBrasileira.Installer",
  "Assets",
  "app-icon.ico",
);
const sizes = [16, 24, 32, 48, 64, 128, 256];

await mkdir(path.dirname(destination), { recursive: true });
const svg = await readFile(source);
const images = await Promise.all(
  sizes.map((size) =>
    sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain" })
      .png()
      .toBuffer(),
  ),
);

const headerSize = 6;
const entrySize = 16;
const dataStart = headerSize + entrySize * images.length;
const header = Buffer.alloc(dataStart);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);

let imageOffset = dataStart;
for (let index = 0; index < images.length; index += 1) {
  const size = sizes[index];
  const entryOffset = headerSize + entrySize * index;
  header.writeUInt8(size === 256 ? 0 : size, entryOffset);
  header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
  header.writeUInt8(0, entryOffset + 2);
  header.writeUInt8(0, entryOffset + 3);
  header.writeUInt16LE(1, entryOffset + 4);
  header.writeUInt16LE(32, entryOffset + 6);
  header.writeUInt32LE(images[index].length, entryOffset + 8);
  header.writeUInt32LE(imageOffset, entryOffset + 12);
  imageOffset += images[index].length;
}

await writeFile(destination, Buffer.concat([header, ...images]));
console.log(`Ícone Windows gerado: ${destination}`);
