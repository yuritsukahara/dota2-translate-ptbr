import { getDb } from "@/db";
import { auditEvents, petitionSignatures } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "petition.sign", 3, 86_400);
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(petitionSignatures).values({
      id,
      userId: user.id,
      statementVersion: "2026-07-26",
    }).onConflictDoNothing();
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: user.id,
      action: "petition.sign",
      subjectType: "petition",
      subjectId: "official-ptbr-audio-2026",
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível registrar a assinatura." }, { status: 500 });
  }
}
