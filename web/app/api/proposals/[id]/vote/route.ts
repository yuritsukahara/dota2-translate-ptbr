import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, proposals, votes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { refreshEligibility } from "@/lib/database";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "vote.toggle", 30, 60);
    const { id } = await params;
    const db = getDb();
    const [proposal] = await db.select({ status: proposals.status }).from(proposals).where(eq(proposals.id, id)).limit(1);
    if (!proposal || !["open", "eligible"].includes(proposal.status)) {
      return Response.json({ error: "Esta proposta não está aberta para votação." }, { status: 409 });
    }
    const [existing] = await db.select().from(votes).where(and(eq(votes.proposalId, id), eq(votes.userId, user.id))).limit(1);
    if (existing) {
      await db.delete(votes).where(and(eq(votes.proposalId, id), eq(votes.userId, user.id)));
    } else {
      await db.insert(votes).values({ proposalId: id, userId: user.id });
    }
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: user.id, action: "vote.toggle", subjectType: "proposal", subjectId: id,
      metadata: JSON.stringify({ supported: !existing }),
    });
    await refreshEligibility(id);
    return Response.json({ supported: !existing });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível registrar o voto." }, { status: 500 });
  }
}
