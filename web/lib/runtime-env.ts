import { env } from "cloudflare:workers";

export type RuntimeEnv = {
  DB: D1Database;
  AUDIO: R2Bucket;
  STEAM_WEB_API_KEY?: string;
  ADMIN_STEAM_IDS?: string;
  PUBLIC_SITE_URL?: string;
};

export const runtimeEnv = env as unknown as RuntimeEnv;
