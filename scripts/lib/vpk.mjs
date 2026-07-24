import fs from "node:fs";

const SIGNATURE = 0x55aa1234;

function readCString(buffer, state) {
  const end = buffer.indexOf(0, state.offset);
  if (end < 0) throw new Error("VPK inválido: string sem terminador.");
  const value = buffer.toString("utf8", state.offset, end);
  state.offset = end + 1;
  return value;
}

export function listVpkEntries(vpkPath) {
  const buffer = fs.readFileSync(vpkPath);
  if (buffer.length < 12 || buffer.readUInt32LE(0) !== SIGNATURE) {
    throw new Error(`Arquivo não parece ser um VPK válido: ${vpkPath}`);
  }

  const version = buffer.readUInt32LE(4);
  if (version !== 1 && version !== 2) {
    throw new Error(`Versão VPK não suportada: ${version}`);
  }

  const headerSize = version === 2 ? 28 : 12;
  const treeSize = buffer.readUInt32LE(8);
  const treeEnd = headerSize + treeSize;
  const state = { offset: headerSize };
  const entries = [];

  while (state.offset < treeEnd) {
    const extension = readCString(buffer, state);
    if (!extension) break;

    while (state.offset < treeEnd) {
      const directory = readCString(buffer, state);
      if (!directory) break;

      while (state.offset < treeEnd) {
        const filename = readCString(buffer, state);
        if (!filename) break;
        if (state.offset + 18 > buffer.length) {
          throw new Error("VPK inválido: entrada truncada.");
        }

        const crc32 = buffer.readUInt32LE(state.offset);
        const preloadBytes = buffer.readUInt16LE(state.offset + 4);
        const archiveIndex = buffer.readUInt16LE(state.offset + 6);
        const entryOffset = buffer.readUInt32LE(state.offset + 8);
        const entryLength = buffer.readUInt32LE(state.offset + 12);
        const terminator = buffer.readUInt16LE(state.offset + 16);
        state.offset += 18;

        if (terminator !== 0xffff) {
          throw new Error("VPK inválido: terminador de entrada incorreto.");
        }

        const prefix = directory === " " ? "" : `${directory}/`;
        entries.push({
          path: `${prefix}${filename}.${extension}`,
          crc32,
          preloadBytes,
          archiveIndex,
          entryOffset,
          entryLength
        });
        state.offset += preloadBytes;
      }
    }
  }

  return entries;
}
