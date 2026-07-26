import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  auditEvents,
  captionSuggestions,
  captionSuggestionVotes,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "caption_suggestion.vote", 60, 60);
    const { id } = await params;
    const payload = await request.json() as { kind?: "support" | "oppose" };
    if (!["support", "oppose"].includes(payload.kind || "")) {
      return Response.json({ error: "Voto inválido." }, { status: 400 });
    }

    const db = getDb();
    const [suggestion] = await db
      .select({ status: captionSuggestions.status })
      .from(captionSuggestions)
      .where(eq(captionSuggestions.id, id))
      .limit(1);
    if (!suggestion || suggestion.status !== "open") {
      return Response.json({ error: "Esta sugestão não está aberta para votação." }, { status: 409 });
    }

    const whereVote = and(
      eq(captionSuggestionVotes.suggestionId, id),
      eq(captionSuggestionVotes.userId, user.id),
    );
    const [existing] = await db.select().from(captionSuggestionVotes).where(whereVote).limit(1);
    let active: "support" | "oppose" | null = payload.kind!;
    if (existing?.kind === payload.kind) {
      await db.delete(captionSuggestionVotes).where(whereVote);
      active = null;
    } else if (existing) {
      await db.update(captionSuggestionVotes).set({ kind: payload.kind! }).where(whereVote);
    } else {
      await db.insert(captionSuggestionVotes).values({
        suggestionId: id,
        userId: user.id,
        kind: payload.kind!,
      });
    }
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: user.id,
      action: "caption_suggestion.vote",
      subjectType: "caption_suggestion",
      subjectId: id,
      metadata: JSON.stringify({ kind: active }),
    });
    return Response.json({ vote: active });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível registrar o voto." }, { status: 500 });
  }
}
