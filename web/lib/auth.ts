import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { roles, sessions, users } from "@/db/schema";
import { parseCookies } from "./cookies";
import { runtimeEnv } from "./runtime-env";

export type CommunityUser = {
  id: string;
  steamId: string;
  displayName: string;
  avatarUrl: string | null;
  roles: string[];
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
  const assigned = await db.select({ role: roles.role }).from(roles).where(eq(roles.userId, record.user.id));
  return { ...record.user, roles: assigned.map((item) => item.role) };
}

export async function requireUser(request: Request) {
  const user = await currentUser(request);
  if (!user) throw new Response(JSON.stringify({ error: "Entre com Steam para continuar." }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
  return user;
}

export async function grantInitialRoles(userId: string, steamId: string) {
  const db = getDb();
  await db.insert(roles).values({ userId, role: "member" }).onConflictDoNothing();
  const admins = String(runtimeEnv.ADMIN_STEAM_IDS || "").split(",").map((value) => value.trim()).filter(Boolean);
  if (admins.includes(steamId)) {
    await db.insert(roles).values({ userId, role: "admin" }).onConflictDoNothing();
  }
}
