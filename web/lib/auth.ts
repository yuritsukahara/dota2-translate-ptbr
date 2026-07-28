import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { parseCookies } from "./cookies";

export type CommunityUser = {
  id: string;
  steamId: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function currentUser(request: Request): Promise<CommunityUser | null> {
  const sessionId = parseCookies(request.headers.get("cookie")).get("dt_session");
  if (!sessionId) return null;
  const db = getDb();
  const [record] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date().toISOString())))
    .limit(1);
  if (!record || record.user.blockedAt) return null;
  return {
    id: record.user.id,
    steamId: record.user.steamId,
    displayName: record.user.displayName,
    avatarUrl: record.user.avatarUrl,
  };
}

export async function requireUser(request: Request) {
  const user = await currentUser(request);
  if (!user) throw new Response(JSON.stringify({ error: "Entre com Steam para continuar." }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
  return user;
}
