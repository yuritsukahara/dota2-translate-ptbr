import fs from "node:fs";
import path from "node:path";
import { listVpkEntries, readVpkEntryRecord } from "./lib/vpk.mjs";

const SIGNATURE = 0x55aa1234;
const ARCHIVE_INDEX = 0;
const ENTRY_TERMINATOR = 0xffff;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function cString(value) {
  return Buffer.from(`${value}\0`, "utf8");
}

function collectFiles(root) {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile()) files.push(absolutePath);
    }
  }
  visit(root);
  return files.sort((left, right) => left.localeCompare(right));
}

const [sourceRootArgument, outputBaseArgument, ...options] = process.argv.slice(2);
if (!sourceRootArgument || !outputBaseArgument) {
  throw new Error(
    "Uso: node scripts/pack-language-vpk.mjs <diretório-fonte> <base-de-saída> [--base <pak01_dir.vpk>]"
  );
}

const sourceRoot = path.resolve(sourceRootArgument);
const outputBase = path.resolve(outputBaseArgument);
const baseIndex = options.indexOf("--base");
const baseVpk =
  baseIndex >= 0 && options[baseIndex + 1]
    ? path.resolve(options[baseIndex + 1])
    : null;
const entriesByPath = new Map();

if (baseVpk && fs.existsSync(baseVpk)) {
  for (const entry of listVpkEntries(baseVpk)) {
    entriesByPath.set(entry.path.toLowerCase(), {
      relativePath: entry.path,
      data: readVpkEntryRecord(baseVpk, entry)
    });
  }
}

for (const absolutePath of collectFiles(sourceRoot)) {
  const relativePath = path.relative(sourceRoot, absolutePath).replaceAll("\\", "/");
  entriesByPath.set(relativePath.toLowerCase(), {
    relativePath,
    data: fs.readFileSync(absolutePath)
  });
}

const entries = [...entriesByPath.values()]
  .sort((left, right) => left.relativePath.localeCompare(right.relativePath))
  .map(({ relativePath, data }) => {
  const extension = path.posix.extname(relativePath).slice(1);
  const directory = path.posix.dirname(relativePath);
  const filename = path.posix.basename(relativePath, `.${extension}`);
  return { extension, directory, filename, data };
});

const groups = new Map();
for (const entry of entries) {
  if (!groups.has(entry.extension)) groups.set(entry.extension, new Map());
  const directories = groups.get(entry.extension);
  if (!directories.has(entry.directory)) directories.set(entry.directory, []);
  directories.get(entry.directory).push(entry);
}

const treeParts = [];
const archiveParts = [];
let archiveOffset = 0;

for (const extension of [...groups.keys()].sort()) {
  treeParts.push(cString(extension));
  const directories = groups.get(extension);
  for (const directory of [...directories.keys()].sort()) {
    treeParts.push(cString(directory === "." ? " " : directory));
    for (const entry of directories.get(directory).sort((a, b) =>
      a.filename.localeCompare(b.filename)
    )) {
      const record = Buffer.alloc(18);
      record.writeUInt32LE(crc32(entry.data), 0);
      record.writeUInt16LE(0, 4);
      record.writeUInt16LE(ARCHIVE_INDEX, 6);
      record.writeUInt32LE(archiveOffset, 8);
      record.writeUInt32LE(entry.data.length, 12);
      record.writeUInt16LE(ENTRY_TERMINATOR, 16);
      treeParts.push(cString(entry.filename), record);
      archiveParts.push(entry.data);
      archiveOffset += entry.data.length;
    }
    treeParts.push(Buffer.from([0]));
  }
  treeParts.push(Buffer.from([0]));
}
treeParts.push(Buffer.from([0]));

const tree = Buffer.concat(treeParts);
const header = Buffer.alloc(12);
header.writeUInt32LE(SIGNATURE, 0);
header.writeUInt32LE(1, 4);
header.writeUInt32LE(tree.length, 8);

fs.mkdirSync(path.dirname(outputBase), { recursive: true });
fs.writeFileSync(`${outputBase}_dir.vpk`, Buffer.concat([header, tree]));
fs.writeFileSync(`${outputBase}_000.vpk`, Buffer.concat(archiveParts));

console.log(
  `VPK criado: ${entries.length} arquivos, ${archiveOffset} bytes de dados.`
);
