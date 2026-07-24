import { and, count, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents } from "@/db/schema";

export async function assertRateLimit(actorId: string, action: string, limit: number, windowSeconds: number) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const db = getDb();
  const [row] = await db
    .select({ value: count() })
    .from(auditEvents)
    .where(and(eq(auditEvents.actorId, actorId), eq(auditEvents.action, action), gt(auditEvents.createdAt, since)));
  if ((row?.value ?? 0) >= limit) {
    throw new Response(JSON.stringify({ error: "Muitas ações em pouco tempo. Tente novamente mais tarde." }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": String(windowSeconds) },
    });
  }
}
