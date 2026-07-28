import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildRoot = path.join(root, "build", "r2-audio", "build-6869");
const statePath = path.join(root, "build", "r2-audio", "upload-state.json");
const wranglerCli = path.join(
  root,
  "web",
  "node_modules",
  "wrangler",
  "bin",
  "wrangler.js",
);
const bucket = "dublagem-brasileira-media";
const concurrency = Math.max(
  1,
  Math.min(6, Number(process.env.R2_UPLOAD_CONCURRENCY || 4)),
);

const manifest = JSON.parse(
  await fs.readFile(path.join(buildRoot, "manifest.json"), "utf8"),
);
const previousState = await fs
  .readFile(statePath, "utf8")
  .then(JSON.parse)
  .catch(() => ({ uploaded: {} }));
const uploaded = previousState.uploaded || {};

const artifacts = manifest.scopes.flatMap((scope) => [
  {
    key: scope.packKey,
    file: path.join(buildRoot, "packs", `${scope.scope}.bin`),
    contentType: "application/octet-stream",
    fingerprint: `${scope.bytes}:${scope.packSha256}`,
  },
  {
    key: scope.indexKey,
    file: path.join(buildRoot, "indexes", `${scope.scope}.json`),
    contentType: "application/json; charset=utf-8",
    fingerprint: `${scope.indexBytes}:${scope.packSha256}`,
  },
]);
artifacts.push({
  key: "audio/build-6869/manifest.json",
  file: path.join(buildRoot, "manifest.json"),
  contentType: "application/json; charset=utf-8",
  fingerprint: `${manifest.files}:${manifest.bytes}:${manifest.generatedAt}`,
});

const pending = artifacts.filter(
  (artifact) => uploaded[artifact.key] !== artifact.fingerprint,
);
let completed = artifacts.length - pending.length;

async function saveState() {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(
    statePath,
    `${JSON.stringify(
      { build: manifest.build, updatedAt: new Date().toISOString(), uploaded },
      null,
      2,
    )}\n`,
  );
}

function upload(artifact) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        wranglerCli,
        "r2",
        "object",
        "put",
        `${bucket}/${artifact.key}`,
        "--file",
        artifact.file,
        "--content-type",
        artifact.contentType,
        "--cache-control",
        "public, max-age=31536000, immutable",
        "--remote",
        "--force",
      ],
      {
        cwd: path.join(root, "web"),
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let output = "";
    child.stdout.on("data", (chunk) => {
      output = `${output}${chunk}`.slice(-4000);
    });
    child.stderr.on("data", (chunk) => {
      output = `${output}${chunk}`.slice(-4000);
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Falha ao enviar ${artifact.key}\n${output}`));
    });
  });
}

async function uploadWithRetry(artifact) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await upload(artifact);
      uploaded[artifact.key] = artifact.fingerprint;
      completed += 1;
      await saveState();
      const size = (await fs.stat(artifact.file)).size;
      console.log(
        `${String(completed).padStart(3, " ")}/${artifacts.length} · ${artifact.key} · ${(size / 1_000_000).toFixed(1)} MB`,
      );
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `Tentativa ${attempt}/3 falhou para ${artifact.key}: ${error.message}`,
      );
    }
  }
  throw lastError;
}

console.log(
  `${pending.length} objetos pendentes de ${artifacts.length} · concorrência ${concurrency}`,
);
const queue = [...pending];
const workers = Array.from(
  { length: Math.min(concurrency, queue.length) },
  async () => {
    while (queue.length) {
      const artifact = queue.shift();
      await uploadWithRetry(artifact);
    }
  },
);
await Promise.all(workers);
console.log("Catálogo de áudio enviado ao R2.");
