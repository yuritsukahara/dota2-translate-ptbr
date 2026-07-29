import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listVpkEntries } from "./lib/vpk.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");
const requireFromWeb = createRequire(path.join(repositoryRoot, "web", "package.json"));
const { zipSync } = requireFromWeb("fflate");

const releaseTag = process.env.INSTALLER_RELEASE_TAG || "installer-channel-stable";
const repository = "yuritsukahara/dota2-translate-ptbr";
const releaseRoot = path.join(repositoryRoot, "build", "windows-installer-release");
const stagingRoot = path.join(releaseRoot, "staging");
const captionsLanguageRoot = path.join(
  stagingRoot,
  "layers",
  "captions",
  "dota_brazilian",
);
const axeLanguageRoot = path.join(
  stagingRoot,
  "layers",
  "captions-axe",
  "dota_brazilian",
);
const captionsOverlayRoot = path.join(releaseRoot, "overlay-captions");
const axeOverlayRoot = path.join(releaseRoot, "overlay-captions-axe");
const captionManifestPath = path.join(
  repositoryRoot,
  "build",
  "caption-pack",
  "dota_brazilian",
  "caption-pack-manifest.json",
);
const captionSubtitlesRoot = path.join(
  repositoryRoot,
  "build",
  "caption-pack",
  "dota_brazilian",
  "resource",
  "subtitles",
);
const captionAnchorPath = path.join(
  repositoryRoot,
  "build",
  "caption-anchor-test",
  "resource",
  "subtitles",
  "subtitles_announcer_brazilian.txt",
);
const axeAudioRoot = path.join(
  repositoryRoot,
  "audio",
  "compiled",
  "dota_brazilian",
  "sounds",
  "vo",
  "axe",
);

function run(script, args = []) {
  execFileSync(process.execPath, [path.join(scriptDirectory, script), ...args], {
    cwd: repositoryRoot,
    env: process.env,
    stdio: "inherit",
  });
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function collectFiles(root, relative = "") {
  const result = {};
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const childRelative = path.join(relative, entry.name);
    if (entry.isDirectory()) {
      Object.assign(result, collectFiles(root, childRelative));
    } else if (entry.isFile()) {
      result[childRelative.replaceAll("\\", "/")] = fs.readFileSync(
        path.join(root, childRelative),
      );
    }
  }
  return result;
}

run("build-local-caption-pack.mjs");
run("build-caption-anchor-test.mjs");

if (!fs.existsSync(axeAudioRoot)) {
  throw new Error(`Pack compilado do Axe não encontrado: ${axeAudioRoot}`);
}

fs.rmSync(releaseRoot, { recursive: true, force: true });
for (const overlayRoot of [captionsOverlayRoot, axeOverlayRoot]) {
  const overlaySubtitlesRoot = path.join(
    overlayRoot,
    "resource",
    "subtitles",
  );
  fs.mkdirSync(overlaySubtitlesRoot, { recursive: true });
  fs.cpSync(captionSubtitlesRoot, overlaySubtitlesRoot, { recursive: true });
  fs.copyFileSync(
    captionAnchorPath,
    path.join(
      overlaySubtitlesRoot,
      "subtitles_announcer_brazilian.txt",
    ),
  );
}
fs.mkdirSync(path.join(axeOverlayRoot, "sounds", "vo", "axe"), { recursive: true });
fs.mkdirSync(captionsLanguageRoot, { recursive: true });
fs.mkdirSync(axeLanguageRoot, { recursive: true });

const axeFiles = fs
  .readdirSync(axeAudioRoot)
  .filter((name) => name.endsWith(".vsnd_c"))
  .sort();
for (const name of axeFiles) {
  fs.copyFileSync(
    path.join(axeAudioRoot, name),
    path.join(axeOverlayRoot, "sounds", "vo", "axe", name),
  );
}

run("pack-language-vpk.mjs", [
  captionsOverlayRoot,
  path.join(captionsLanguageRoot, "pak01"),
]);
run("pack-language-vpk.mjs", [
  axeOverlayRoot,
  path.join(axeLanguageRoot, "pak01"),
]);

const expectedSubtitleFiles = fs
  .readdirSync(captionSubtitlesRoot)
  .filter((name) => name.endsWith("_brazilian.txt"))
  .sort();
for (const [modeRoot, overlayRoot] of [
  [captionsLanguageRoot, captionsOverlayRoot],
  [axeLanguageRoot, axeOverlayRoot],
]) {
  const packedEntries = new Set(
    listVpkEntries(path.join(modeRoot, "pak01_dir.vpk")).map(
      (entry) => entry.path,
    ),
  );
  for (const filename of expectedSubtitleFiles) {
    const entry = `resource/subtitles/${filename}`;
    if (!packedEntries.has(entry)) {
      throw new Error(`Caption ausente no VPK: ${entry}`);
    }
  }
  fs.cpSync(
    path.join(overlayRoot, "resource", "subtitles"),
    path.join(modeRoot, "resource", "subtitles"),
    { recursive: true },
  );
}

const gameInfo = `"GameInfo"
{
    LayeredOnMod dota

    FileSystem
    {
        SearchPaths
        {
            Game dota_brazilian
            Game dota
            Game core
            Mod dota_brazilian
            Mod dota
            PublicContent core
        }
    }
}
`;
for (const languageRoot of [captionsLanguageRoot, axeLanguageRoot]) {
  fs.writeFileSync(path.join(languageRoot, "gameinfo.gi"), gameInfo, "utf8");
}

const captionManifest = JSON.parse(fs.readFileSync(captionManifestPath, "utf8"));
const payloadFiles = collectFiles(stagingRoot);
const payloadManifest = {
  schemaVersion: 1,
  version: `${captionManifest.build.clientVersion}.5`,
  createdAt: new Date().toISOString(),
  dotaBuild: captionManifest.build,
  captions: {
    tokens: captionManifest.tokens,
    files: captionManifest.files,
    sources: {
      official: captionManifest.sources.official,
      community: captionManifest.sources.community,
      suggested: captionManifest.sources.automatic,
    },
  },
  voicePacks: [
    {
      id: "axe",
      lines: axeFiles.length,
    },
  ],
  modes: [
    {
      id: "captions",
      path: "layers/captions/dota_brazilian",
      captions: true,
      voicePacks: [],
    },
    {
      id: "captions-axe",
      path: "layers/captions-axe/dota_brazilian",
      captions: true,
      voicePacks: ["axe"],
    },
  ],
  files: Object.entries(payloadFiles).map(([name, contents]) => ({
    path: name,
    bytes: contents.length,
    sha256: sha256(contents),
  })),
};

const payloadManifestBuffer = Buffer.from(
  `${JSON.stringify(payloadManifest, null, 2)}\n`,
  "utf8",
);
payloadFiles["payload-manifest.json"] = payloadManifestBuffer;

const archive = Buffer.from(zipSync(payloadFiles, { level: 6 }));
const archiveName = "dublagem-ptbr-payload.zip";
const archivePath = path.join(releaseRoot, archiveName);
fs.writeFileSync(archivePath, archive);

const downloadRoot = `https://github.com/${repository}/releases/download/${releaseTag}`;
const installerManifest = {
  schemaVersion: 1,
  version: payloadManifest.version,
  createdAt: payloadManifest.createdAt,
  dotaBuild: payloadManifest.dotaBuild,
  captions: payloadManifest.captions,
  voicePacks: payloadManifest.voicePacks,
  payload: {
    url: `${downloadRoot}/${archiveName}`,
    bytes: archive.length,
    sha256: sha256(archive),
  },
};
const installerManifestContents = `${JSON.stringify(installerManifest, null, 2)}\n`;
fs.writeFileSync(
  path.join(releaseRoot, "installer-manifest.json"),
  installerManifestContents,
  "utf8",
);
fs.writeFileSync(
  path.join(repositoryRoot, "web", "data", "installer-release.json"),
  installerManifestContents,
  "utf8",
);

fs.rmSync(stagingRoot, { recursive: true, force: true });
fs.rmSync(captionsOverlayRoot, { recursive: true, force: true });
fs.rmSync(axeOverlayRoot, { recursive: true, force: true });

console.log(
  `${captionManifest.tokens.toLocaleString("pt-BR")} captions e ` +
    `${axeFiles.length} vozes empacotadas.`,
);
console.log(`${archive.length.toLocaleString("pt-BR")} bytes · ${archivePath}`);
