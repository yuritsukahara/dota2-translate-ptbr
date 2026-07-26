import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditions, auditionVotes, auditEvents } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "audition.vote", 30, 60);
    const { id } = await params;
    const db = getDb();
    const [audition] = await db
      .select({ status: auditions.status })
      .from(auditions)
      .where(eq(auditions.id, id))
      .limit(1);
    if (!audition || audition.status !== "open") {
      return Response.json({ error: "Esta audição não está aberta." }, { status: 409 });
    }
    const filter = and(
      eq(auditionVotes.auditionId, id),
      eq(auditionVotes.userId, user.id)
    );
    const [existing] = await db.select().from(auditionVotes).where(filter).limit(1);
    if (existing) await db.delete(auditionVotes).where(filter);
    else await db.insert(auditionVotes).values({ auditionId: id, userId: user.id });
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: user.id,
      action: "audition.vote",
      subjectType: "audition",
      subjectId: id,
      metadata: JSON.stringify({ supported: !existing }),
    });
    return Response.json({ supported: !existing });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível registrar o voto." }, { status: 500 });
  }
}
