import { and, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, auditions, voicePacks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getHero } from "@/lib/catalog";
import { assertSameOrigin } from "@/lib/csrf";
import { hasRequiredRole } from "@/lib/database";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const moderator = await requireUser(request);
    if (!(await hasRequiredRole(moderator.id, ["moderator", "admin"]))) {
      return Response.json({ error: "Papel de moderador necessário." }, { status: 403 });
    }
    const { id } = await params;
    const db = getDb();
    const [audition] = await db.select().from(auditions).where(eq(auditions.id, id)).limit(1);
    if (!audition || audition.status !== "open") {
      return Response.json({ error: "A audição não está aberta para decisão." }, { status: 409 });
    }
    const hero = getHero(audition.heroId);
    if (!hero) return Response.json({ error: "Herói não encontrado." }, { status: 404 });
    const packId = crypto.randomUUID();
    await db.batch([
      db.update(auditions).set({
        status: "winner",
        decidedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      }).where(eq(auditions.id, id)),
      db.update(auditions).set({
        status: "rejected",
        decidedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      }).where(and(eq(auditions.heroId, audition.heroId), ne(auditions.id, id), eq(auditions.status, "open"))),
      db.insert(voicePacks).values({
        id: packId,
        heroId: audition.heroId,
        authorId: audition.authorId,
        auditionId: id,
        status: "recording",
        totalLines: hero.officialBrazilianCaptions,
        submittedLines: 5,
      }),
      db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: moderator.id,
        action: "audition.select_winner",
        subjectType: "audition",
        subjectId: id,
        metadata: JSON.stringify({ heroId: audition.heroId, packId }),
      }),
    ]);
    return Response.json({ winner: id, packId });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível selecionar o vencedor." }, { status: 500 });
  }
}
