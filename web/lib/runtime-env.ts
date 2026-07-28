import { env } from "cloudflare:workers";

export type RuntimeEnv = {
  DB: D1Database;
  MEDIA: R2Bucket;
  SUBMISSIONS: R2Bucket;
  STEAM_WEB_API_KEY?: string;
  PUBLIC_SITE_URL?: string;
};

export const runtimeEnv = env as unknown as RuntimeEnv;
