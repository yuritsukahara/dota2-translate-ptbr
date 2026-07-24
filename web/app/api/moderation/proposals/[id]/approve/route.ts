import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, lines, proposals } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { hasRequiredRole } from "@/lib/database";
import { runtimeEnv } from "@/lib/runtime-env";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    if (!await hasRequiredRole(user.id, ["moderator", "admin"])) {
      return Response.json({ error: "Papel de moderador necessário." }, { status: 403 });
    }
    const { id } = await params;
    const db = getDb();
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
    if (!proposal || proposal.status !== "eligible") {
      return Response.json({ error: "A proposta ainda não cumpriu quórum e revisões." }, { status: 409 });
    }

    let approvedObjectKey = proposal.audioObjectKey;
    if (proposal.kind === "audio" && proposal.audioObjectKey) {
      const source = await runtimeEnv.AUDIO.get(proposal.audioObjectKey);
      if (!source) return Response.json({ error: "Objeto de áudio pendente não encontrado." }, { status: 404 });
      approvedObjectKey = proposal.audioObjectKey.replace(/^pending\//, "approved/");
      await runtimeEnv.AUDIO.put(approvedObjectKey, source.body, {
        httpMetadata: source.httpMetadata,
        customMetadata: source.customMetadata,
      });
      await runtimeEnv.AUDIO.delete(proposal.audioObjectKey);
    }

    await db.update(proposals).set({
      status: "approved",
      audioObjectKey: approvedObjectKey,
      decidedAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    }).where(eq(proposals.id, id));
    await db.update(lines).set(
      proposal.kind === "translation"
        ? { translationStatus: "approved", updatedAt: sql`CURRENT_TIMESTAMP` }
        : { audioStatus: "recorded", updatedAt: sql`CURRENT_TIMESTAMP` },
    ).where(eq(lines.id, proposal.lineId));
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: user.id, action: "proposal.approve",
      subjectType: "proposal", subjectId: id,
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível aprovar a proposta." }, { status: 500 });
  }
}
