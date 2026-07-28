import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "build",
  "local-audio",
);
const port = Number(process.env.LOCAL_AUDIO_PORT || 4173);
const host = "127.0.0.1";
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
};

if (!fs.existsSync(path.join(root, "index.html"))) {
  throw new Error("Catálogo não encontrado. Execute npm run audio:catalog -- --all primeiro.");
}

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, `http://${host}:${port}`).pathname);
  const relative = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end("Acesso negado");
    return;
  }

  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    response.writeHead(404).end("Arquivo não encontrado");
    return;
  }
  if (!stat.isFile()) {
    response.writeHead(404).end("Arquivo não encontrado");
    return;
  }

  const headers = {
    "content-type": contentTypes[path.extname(target).toLowerCase()] || "application/octet-stream",
    "accept-ranges": "bytes",
    "cache-control": target.endsWith(".mp3") ? "public, max-age=3600" : "no-cache",
  };
  const range = request.headers.range;
  if (range) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    if (!match || start > end || start >= stat.size) {
      response.writeHead(416, { "content-range": `bytes */${stat.size}` }).end();
      return;
    }
    response.writeHead(206, {
      ...headers,
      "content-length": end - start + 1,
      "content-range": `bytes ${start}-${end}/${stat.size}`,
    });
    fs.createReadStream(target, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, "content-length": stat.size });
  fs.createReadStream(target).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Catálogo local disponível em http://${host}:${port}`);
  console.log("Pressione Ctrl+C para encerrar.");
});
