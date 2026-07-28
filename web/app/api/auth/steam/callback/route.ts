import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { cookie, parseCookies } from "@/lib/cookies";
import { randomToken, safeReturnPath } from "@/lib/steam-openid";
import { runtimeEnv } from "@/lib/runtime-env";
import { fetchPublicSteamProfile } from "@/lib/steam-profile";

type SteamPlayer = {
  steamid: string;
  personaname: string;
  avatarfull?: string;
  timecreated?: number;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secureCookie = url.protocol === "https:";
  const requestCookies = parseCookies(request.headers.get("cookie"));
  const state = requestCookies.get("dt_steam_state");
  const returnTo = safeReturnPath(requestCookies.get("dt_steam_return_to"));
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

  const steamId = match[1];
  let profile: SteamPlayer = {
    steamid: steamId,
    personaname: `Jogador Steam ${steamId.slice(-6)}`,
  };
  if (runtimeEnv.STEAM_WEB_API_KEY) {
    try {
      const profileUrl = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
      profileUrl.searchParams.set("key", runtimeEnv.STEAM_WEB_API_KEY);
      profileUrl.searchParams.set("steamids", steamId);
      const profileResponse = await fetch(profileUrl);
      if (profileResponse.ok) {
        const payload = await profileResponse.json() as { response?: { players?: SteamPlayer[] } };
        profile = payload.response?.players?.[0] || profile;
      }
    } catch {
      // O perfil público abaixo mantém o login funcional quando a API está indisponível.
    }
  }
  if (!profile.avatarfull || profile.personaname.startsWith("Jogador Steam ")) {
    const publicProfile = await fetchPublicSteamProfile(steamId);
    if (publicProfile) {
      profile = {
        ...profile,
        personaname: publicProfile.personaname || profile.personaname,
        avatarfull: publicProfile.avatarfull || profile.avatarfull,
      };
    }
  }
  if (profile.timecreated && Date.now() - profile.timecreated * 1000 < 30 * 86_400_000) {
    return Response.json({ error: "Use uma conta Steam com pelo menos 30 dias." }, { status: 403 });
  }

  const proposedId = `usr_steam_${steamId}`;
  const db = getDb();
  const [existingUser] = await db
    .select({ displayName: users.displayName, avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.steamId, steamId))
    .limit(1);
  const displayName = profile.personaname.startsWith("Jogador Steam ") && existingUser
    ? existingUser.displayName
    : profile.personaname;
  const avatarUrl = profile.avatarfull || existingUser?.avatarUrl || null;
  await db.insert(users).values({
    id: proposedId,
    steamId,
    displayName,
    avatarUrl,
    steamAccountCreatedAt: profile.timecreated
      ? new Date(profile.timecreated * 1000).toISOString()
      : new Date().toISOString(),
  }).onConflictDoUpdate({
    target: users.steamId,
    set: { displayName, avatarUrl, updatedAt: sql`CURRENT_TIMESTAMP` },
  });
  const [savedUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.steamId, steamId))
    .limit(1);
  if (!savedUser) {
    return Response.json({ error: "Não foi possível salvar o perfil Steam." }, { status: 500 });
  }
  const sessionId = randomToken(40);
  await db.insert(sessions).values({
    id: sessionId,
    userId: savedUser.id,
    expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  });
  const headers = new Headers({
    location: new URL(returnTo, runtimeEnv.PUBLIC_SITE_URL || request.url).toString(),
  });
  headers.append("set-cookie", cookie("dt_session", sessionId, 30 * 86_400, secureCookie));
  headers.append("set-cookie", cookie("dt_steam_state", "", 0, secureCookie));
  headers.append("set-cookie", cookie("dt_steam_return_to", "", 0, secureCookie));
  return new Response(null, { status: 302, headers });
}
