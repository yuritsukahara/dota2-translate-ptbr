import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { grantInitialRoles, isDiscordAccountOldEnough } from "@/lib/auth";
import { cookie, parseCookies } from "@/lib/cookies";
import { randomToken } from "@/lib/oauth";
import { runtimeEnv } from "@/lib/runtime-env";

type DiscordUser = { id: string; username: string; global_name?: string | null; avatar?: string | null; verified?: boolean };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookies = parseCookies(request.headers.get("cookie"));
  if (!url.searchParams.get("code") || url.searchParams.get("state") !== cookies.get("dt_oauth_state")) {
    return Response.json({ error: "Fluxo OAuth inválido ou expirado." }, { status: 400 });
  }
  const verifier = cookies.get("dt_oauth_verifier");
  if (!verifier || !runtimeEnv.DISCORD_CLIENT_ID || !runtimeEnv.DISCORD_CLIENT_SECRET || !runtimeEnv.DISCORD_REDIRECT_URI) {
    return Response.json({ error: "OAuth do Discord não está configurado." }, { status: 503 });
  }

  const body = new URLSearchParams({
    client_id: runtimeEnv.DISCORD_CLIENT_ID,
    client_secret: runtimeEnv.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code: url.searchParams.get("code")!,
    redirect_uri: runtimeEnv.DISCORD_REDIRECT_URI,
    code_verifier: verifier,
  });
  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenResponse.ok) return Response.json({ error: "O Discord recusou a autenticação." }, { status: 401 });
  const token = await tokenResponse.json() as { access_token: string };
  const profileResponse = await fetch("https://discord.com/api/users/@me", { headers: { authorization: `Bearer ${token.access_token}` } });
  if (!profileResponse.ok) return Response.json({ error: "Não foi possível consultar o perfil Discord." }, { status: 401 });
  const profile = await profileResponse.json() as DiscordUser;
  if (!profile.verified || !isDiscordAccountOldEnough(profile.id)) {
    return Response.json({ error: "Use uma conta Discord verificada com pelo menos 30 dias." }, { status: 403 });
  }

  const id = `usr_${profile.id}`;
  const avatarUrl = profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=128` : null;
  const db = getDb();
  await db.insert(users).values({
    id,
    discordId: profile.id,
    displayName: profile.global_name || profile.username,
    avatarUrl,
    verified: true,
    discordCreatedAt: new Date(Number((BigInt(profile.id) >> 22n) + 1420070400000n)).toISOString(),
  }).onConflictDoUpdate({
    target: users.discordId,
    set: { displayName: profile.global_name || profile.username, avatarUrl, verified: true, updatedAt: sql`CURRENT_TIMESTAMP` },
  });
  await grantInitialRoles(id, profile.id);
  const sessionId = randomToken(40);
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();
  await db.insert(sessions).values({ id: sessionId, userId: id, expiresAt });
  const headers = new Headers({ location: new URL("/heroes/axe", runtimeEnv.PUBLIC_SITE_URL || request.url).toString() });
  headers.append("set-cookie", cookie("dt_session", sessionId, 30 * 86_400));
  headers.append("set-cookie", cookie("dt_oauth_state", "", 0));
  headers.append("set-cookie", cookie("dt_oauth_verifier", "", 0));
  return new Response(null, { status: 302, headers });
}
