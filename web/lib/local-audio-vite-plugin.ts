import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, sep } from "node:path";
import type { Plugin } from "vite";

const audioRoot = resolve(process.cwd(), "..", "build", "local-audio", "mp3");
const kitRoot = resolve(
  process.cwd(),
  "..",
  "build",
  "r2-public",
  "kits",
  "build-6869",
);

export function localAudio(): Plugin {
  return {
    name: "local-dota-audio",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (request.url?.startsWith("/api/voice-pack-template/")) {
          try {
            const pathname = decodeURIComponent(
              new URL(request.url, "http://localhost").pathname,
            );
            const sourceId = pathname.slice(
              "/api/voice-pack-template/".length,
            );
            if (!/^[a-z0-9_-]{2,80}$/i.test(sourceId)) {
              response.statusCode = 403;
              return response.end("Personagem inválido.");
            }
            const target = resolve(kitRoot, `${sourceId}.zip`);
            if (!target.startsWith(`${kitRoot}${sep}`)) {
              response.statusCode = 403;
              return response.end("Arquivo inválido.");
            }
            const info = await stat(target);
            response.statusCode = 200;
            response.setHeader("content-type", "application/zip");
            response.setHeader("content-length", String(info.size));
            response.setHeader(
              "content-disposition",
              `attachment; filename="${sourceId}-voice-pack.zip"`,
            );
            if (request.method === "HEAD") return response.end();
            return createReadStream(target).pipe(response);
          } catch {
            response.statusCode = 404;
            return response.end("Kit local não encontrado.");
          }
        }
        if (!request.url?.startsWith("/audio/")) return next();
        try {
          const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
          const relative = pathname.slice("/audio/".length).replaceAll("/", sep);
          const target = resolve(audioRoot, relative);
          if (!target.startsWith(`${audioRoot}${sep}`) || !target.toLowerCase().endsWith(".mp3")) {
            response.statusCode = 403;
            return response.end("Arquivo inválido.");
          }
          const info = await stat(target);
          const range = request.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
          const start = range?.[1] ? Number(range[1]) : 0;
          const end = range?.[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
          if (start < 0 || end < start || start >= info.size) {
            response.statusCode = 416;
            response.setHeader("content-range", `bytes */${info.size}`);
            return response.end();
          }
          response.statusCode = range ? 206 : 200;
          response.setHeader("content-type", "audio/mpeg");
          response.setHeader("accept-ranges", "bytes");
          response.setHeader("cache-control", "private, max-age=3600");
          response.setHeader("content-length", String(end - start + 1));
          if (range) response.setHeader("content-range", `bytes ${start}-${end}/${info.size}`);
          if (request.method === "HEAD") return response.end();
          createReadStream(target, { start, end }).pipe(response);
        } catch {
          response.statusCode = 404;
          response.end("Áudio local não encontrado.");
        }
      });
    },
  };
}
