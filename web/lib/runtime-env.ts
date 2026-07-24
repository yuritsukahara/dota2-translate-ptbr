import { env } from "cloudflare:workers";

export type RuntimeEnv = {
  DB: D1Database;
  AUDIO: R2Bucket;
  DISCORD_CLIENT_ID?: string;
  DISCORD_CLIENT_SECRET?: string;
  DISCORD_REDIRECT_URI?: string;
  ADMIN_DISCORD_IDS?: string;
  PUBLIC_SITE_URL?: string;
};

export const runtimeEnv = env as unknown as RuntimeEnv;
