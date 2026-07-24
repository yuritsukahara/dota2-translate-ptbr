import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, proposals, reviews } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { hasRequiredRole, refreshEligibility } from "@/lib/database";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    const allowed = await hasRequiredRole(user.id, ["language_reviewer", "audio_reviewer", "moderator", "admin"]);
    if (!allowed) return Response.json({ error: "Papel de revisor necessário." }, { status: 403 });
    const { id } = await params;
    const payload = await request.json() as { kind?: "language" | "technical"; decision?: "approve" | "request_changes" | "reject"; notes?: string };
    if (!payload.kind || !payload.decision) return Response.json({ error: "Revisão inválida." }, { status: 400 });
    const db = getDb();
    await db.insert(reviews).values({
      id: crypto.randomUUID(), proposalId: id, reviewerId: user.id, kind: payload.kind,
      decision: payload.decision, notes: payload.notes?.trim() || "",
    }).onConflictDoUpdate({
      target: [reviews.proposalId, reviews.kind],
      set: { reviewerId: user.id, decision: payload.decision, notes: payload.notes?.trim() || "", createdAt: sql`CURRENT_TIMESTAMP` },
    });
    if (payload.decision === "reject") {
      await db.update(proposals).set({ status: "rejected", decidedAt: sql`CURRENT_TIMESTAMP`, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(proposals.id, id));
    } else {
      await db.update(proposals).set({ status: "open", openedAt: sql`COALESCE(opened_at, CURRENT_TIMESTAMP)`, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(proposals.id, id));
      await refreshEligibility(id);
    }
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: user.id, action: "proposal.review", subjectType: "proposal", subjectId: id,
      metadata: JSON.stringify({ kind: payload.kind, decision: payload.decision }),
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível registrar a revisão." }, { status: 500 });
  }
}
