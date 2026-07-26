import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditionReactions, auditions } from "@/db/schema";
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
    await assertRateLimit(user.id, "audition.react", 60, 60);
    const { id } = await params;
    const payload = (await request.json()) as { kind?: "like" | "dislike" };
    if (!["like", "dislike"].includes(payload.kind || "")) {
      return Response.json({ error: "Reação inválida." }, { status: 400 });
    }
    const db = getDb();
    const [audition] = await db.select({ id: auditions.id }).from(auditions).where(eq(auditions.id, id)).limit(1);
    if (!audition) return Response.json({ error: "Audição não encontrada." }, { status: 404 });
    const filter = and(
      eq(auditionReactions.auditionId, id),
      eq(auditionReactions.userId, user.id)
    );
    const [existing] = await db.select().from(auditionReactions).where(filter).limit(1);
    if (existing?.kind === payload.kind) {
      await db.delete(auditionReactions).where(filter);
      return Response.json({ kind: null });
    }
    await db
      .insert(auditionReactions)
      .values({ auditionId: id, userId: user.id, kind: payload.kind! })
      .onConflictDoUpdate({
        target: [auditionReactions.auditionId, auditionReactions.userId],
        set: { kind: payload.kind! },
      });
    return Response.json({ kind: payload.kind });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível registrar a reação." }, { status: 500 });
  }
}
