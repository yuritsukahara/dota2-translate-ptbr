import { GET as authMe } from "@/app/api/auth/me/route";
import { POST as authLogout } from "@/app/api/auth/logout/route";
import { GET as authSteamStart } from "@/app/api/auth/steam/start/route";
import { GET as authSteamCallback } from "@/app/api/auth/steam/callback/route";
import { POST as createCaptionSuggestion } from "@/app/api/caption-suggestions/route";
import { GET as getPetition } from "@/app/api/petition/route";
import { POST as signPetition } from "@/app/api/petition/sign/route";
import { GET as getProfile } from "@/app/api/profiles/[id]/route";
import { POST as createVoicePack } from "@/app/api/voice-packs/route";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  SUBMISSIONS: R2Bucket;
}

function jsonError(message: string, status = 404) {
  return Response.json({ error: message }, { status });
}

type AudioIndexEntry = {
  offset: number;
  length: number;
  sha256: string;
};

type AudioIndex = {
  build: string;
  scope: string;
  packKey: string;
  files: Record<string, AudioIndexEntry>;
};

const audioIndexCache = new Map<string, Promise<AudioIndex | null>>();

async function loadAudioIndex(env: Env, scope: string) {
  const cached = audioIndexCache.get(scope);
  if (cached) return cached;
  const pending = (async () => {
    const object = await env.MEDIA.get(
      `audio/build-6869/indexes/${scope}.json`,
    );
    if (!object) return null;
    const index = await object.json<AudioIndex>();
    if (
      index.build !== "6869" ||
      index.scope !== scope ||
      !index.packKey ||
      !index.files
    ) {
      return null;
    }
    return index;
  })();
  audioIndexCache.set(scope, pending);
  const index = await pending;
  if (!index) audioIndexCache.delete(scope);
  return index;
}

function requestedAudioRange(header: string | null, size: number) {
  if (!header) return { start: 0, end: size - 1, partial: false };
  const match = header.match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (!match[1] && !match[2])) return null;
  let start: number;
  let end: number;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
  }
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= size ||
    end < start
  ) {
    return null;
  }
  return { start, end: Math.min(end, size - 1), partial: true };
}

async function originalAudio(
  request: Request,
  env: Env,
  scope: string,
  lineId: string,
) {
  const index = await loadAudioIndex(env, scope);
  const entry = index?.files[lineId];
  if (!index || !entry) {
    return new Response("Áudio não encontrado.", { status: 404 });
  }
  const range = requestedAudioRange(request.headers.get("range"), entry.length);
  if (!range) {
    return new Response(null, {
      status: 416,
      headers: { "content-range": `bytes */${entry.length}` },
    });
  }
  const etag = `"${entry.sha256}"`;
  if (!range.partial && request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { etag, "cache-control": "public, max-age=31536000, immutable" },
    });
  }
  const length = range.end - range.start + 1;
  const headers = new Headers({
    "accept-ranges": "bytes",
    "cache-control": "public, max-age=31536000, immutable",
    "content-length": String(length),
    "content-type": "audio/mpeg",
    etag,
  });
  if (range.partial) {
    headers.set(
      "content-range",
      `bytes ${range.start}-${range.end}/${entry.length}`,
    );
  }
  if (request.method === "HEAD") {
    return new Response(null, {
      status: range.partial ? 206 : 200,
      headers,
    });
  }
  const object = await env.MEDIA.get(index.packKey, {
    range: {
      offset: entry.offset + range.start,
      length,
    },
  });
  if (!object) {
    return new Response("Pack de áudio não encontrado.", { status: 404 });
  }
  return new Response(object.body, {
    status: range.partial ? 206 : 200,
    headers,
  });
}

async function voicePackTemplate(request: Request, env: Env, heroId: string) {
  if (!/^[a-z0-9_-]{2,80}$/i.test(heroId)) {
    return jsonError("Personagem inválido.", 400);
  }
  const object = await env.MEDIA.get(`kits/build-6869/${heroId}.zip`);
  if (!object) {
    return Response.redirect(
      `https://media.traducao.tangoleague.gg/kits/build-6869/${heroId}.zip`,
      302,
    );
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400, immutable");
  headers.set("content-disposition", `attachment; filename="${heroId}-voice-pack.zip"`);
  return new Response(object.body, { headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "GET" && path === "/api/auth/me") return authMe(request);
    if (request.method === "POST" && path === "/api/auth/logout") return authLogout(request);
    if (request.method === "GET" && path === "/api/auth/steam/start") return authSteamStart(request);
    if (request.method === "GET" && path === "/api/auth/steam/callback") return authSteamCallback(request);
    if (request.method === "POST" && path === "/api/caption-suggestions") {
      return createCaptionSuggestion(request);
    }
    if (request.method === "GET" && path === "/api/petition") return getPetition(request);
    if (request.method === "POST" && path === "/api/petition/sign") return signPetition(request);
    if (request.method === "POST" && path === "/api/voice-packs") return createVoicePack(request);

    const profileMatch = path.match(/^\/api\/profiles\/([^/]+)$/);
    if (request.method === "GET" && profileMatch) {
      return getProfile(request, {
        params: Promise.resolve({ id: decodeURIComponent(profileMatch[1]) }),
      });
    }

    const templateMatch = path.match(/^\/api\/voice-pack-template\/([^/]+)$/);
    if (request.method === "GET" && templateMatch) {
      return voicePackTemplate(request, env, templateMatch[1]);
    }

    const audioMatch = path.match(
      /^\/audio\/([a-z0-9_-]{2,80})\/([a-z0-9_.-]{2,180})\.mp3$/i,
    );
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      audioMatch
    ) {
      return originalAudio(request, env, audioMatch[1], audioMatch[2]);
    }

    if (path.startsWith("/api/")) return jsonError("API não encontrada.");
    return env.ASSETS.fetch(request);
  },
};
