import { getDb } from "@/db";
import { auditEvents, reports } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "report.create", 10, 86_400);
    const payload = await request.json() as { proposalId?: string; reason?: string };
    const reason = payload.reason?.trim() || "";
    if (!payload.proposalId || reason.length < 5 || reason.length > 500) {
      return Response.json({ error: "Denúncia inválida." }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const db = getDb();
    await db.insert(reports).values({ id, proposalId: payload.proposalId, reporterId: user.id, reason });
    await db.insert(auditEvents).values({ id: crypto.randomUUID(), actorId: user.id, action: "report.create", subjectType: "proposal", subjectId: payload.proposalId });
    return Response.json({ report: { id, status: "open" } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível registrar a denúncia." }, { status: 500 });
  }
}
