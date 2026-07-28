import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildRoot = path.join(root, "build", "r2-public");
const statePath = path.join(buildRoot, "upload-state.json");
const wranglerCli = path.join(
  root,
  "web",
  "node_modules",
  "wrangler",
  "bin",
  "wrangler.js",
);
const bucket = "dublagem-brasileira-media";
const concurrency = 6;
const manifest = JSON.parse(
  await fs.readFile(path.join(buildRoot, "manifest.json"), "utf8"),
);
const previous = await fs
  .readFile(statePath, "utf8")
  .then(JSON.parse)
  .catch(() => ({ uploaded: {} }));
const uploaded = previous.uploaded || {};
const artifacts = manifest.entries.map((entry) => ({
  ...entry,
  file: path.join(buildRoot, entry.key.replaceAll("/", path.sep)),
  fingerprint: `${entry.bytes}:${entry.sha256}`,
}));
const pending = artifacts.filter(
  (artifact) => uploaded[artifact.key] !== artifact.fingerprint,
);
let completed = artifacts.length - pending.length;

async function saveState() {
  await fs.writeFile(
    statePath,
    `${JSON.stringify(
      {
        build: manifest.build,
        updatedAt: new Date().toISOString(),
        uploaded,
      },
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
        "application/zip",
        "--cache-control",
        "public, max-age=3600",
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
      output = `${output}${chunk}`.slice(-3000);
    });
    child.stderr.on("data", (chunk) => {
      output = `${output}${chunk}`.slice(-3000);
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
      console.log(`${completed}/${artifacts.length} · ${artifact.key}`);
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

console.log(`${pending.length} kits pendentes de ${artifacts.length}.`);
const queue = [...pending];
await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) await uploadWithRetry(queue.shift());
  }),
);
console.log("Kits enviados ao R2.");

