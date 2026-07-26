import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { grantInitialRoles } from "@/lib/auth";
import { cookie, parseCookies } from "@/lib/cookies";
import { randomToken } from "@/lib/oauth";
import { runtimeEnv } from "@/lib/runtime-env";

type SteamPlayer = {
  steamid: string;
  personaname: string;
  avatarfull?: string;
  timecreated?: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const state = parseCookies(request.headers.get("cookie")).get("dt_steam_state");
  if (!state || url.searchParams.get("state") !== state || url.searchParams.get("openid.mode") !== "id_res") {
    return Response.json({ error: "Login Steam inválido ou expirado." }, { status: 400 });
  }

  const claimedId = url.searchParams.get("openid.claimed_id") || "";
  const match = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  if (!match || url.searchParams.get("openid.op_endpoint") !== "https://steamcommunity.com/openid/login") {
    return Response.json({ error: "Identidade Steam inválida." }, { status: 400 });
  }

  const verification = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key.startsWith("openid.")) verification.set(key, value);
  }
  verification.set("openid.mode", "check_authentication");
  const checked = await fetch("https://steamcommunity.com/openid/login", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: verification,
  });
  if (!checked.ok || !(await checked.text()).includes("is_valid:true")) {
    return Response.json({ error: "A Steam não confirmou esta identidade." }, { status: 401 });
  }

  if (!runtimeEnv.STEAM_WEB_API_KEY) {
    return Response.json({ error: "A chave da Steam Web API ainda não foi configurada." }, { status: 503 });
  }
  const steamId = match[1];
  const profileUrl = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
  profileUrl.searchParams.set("key", runtimeEnv.STEAM_WEB_API_KEY);
  profileUrl.searchParams.set("steamids", steamId);
  const profileResponse = await fetch(profileUrl);
  const payload = await profileResponse.json() as { response?: { players?: SteamPlayer[] } };
  const profile = payload.response?.players?.[0];
  if (!profile?.timecreated || Date.now() - profile.timecreated * 1000 < 30 * 86_400_000) {
    return Response.json({ error: "Use uma conta Steam com pelo menos 30 dias." }, { status: 403 });
  }

  const id = `usr_steam_${steamId}`;
  const db = getDb();
  await db.insert(users).values({
    id,
    steamId,
    displayName: profile.personaname,
    avatarUrl: profile.avatarfull || null,
    verified: true,
    steamCreatedAt: new Date(profile.timecreated * 1000).toISOString(),
  }).onConflictDoUpdate({
    target: users.steamId,
    set: { displayName: profile.personaname, avatarUrl: profile.avatarfull || null, verified: true, updatedAt: sql`CURRENT_TIMESTAMP` },
  });
  await grantInitialRoles(id, steamId);
  const sessionId = randomToken(40);
  await db.insert(sessions).values({
    id: sessionId,
    userId: id,
    expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  });
  const headers = new Headers({ location: new URL("/peticao", runtimeEnv.PUBLIC_SITE_URL || request.url).toString() });
  headers.append("set-cookie", cookie("dt_session", sessionId, 30 * 86_400));
  headers.append("set-cookie", cookie("dt_steam_state", "", 0));
  return new Response(null, { status: 302, headers });
}
