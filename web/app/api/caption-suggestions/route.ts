import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  auditEvents,
  captionSuggestions,
  captionSuggestionVotes,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getHero, getHeroLine } from "@/lib/catalog";
import { assertSameOrigin } from "@/lib/csrf";
import { assertRateLimit } from "@/lib/rate-limit";
import { validateTerminology } from "@/lib/terminology";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lineId = url.searchParams.get("line")?.trim() || "";
  if (!lineId) return Response.json({ error: "line é obrigatório." }, { status: 400 });

  const db = getDb();
  const suggestions = await db
    .select({
      id: captionSuggestions.id,
      text: captionSuggestions.text,
      status: captionSuggestions.status,
      author: users.displayName,
      authorAvatar: users.avatarUrl,
      createdAt: captionSuggestions.createdAt,
    })
    .from(captionSuggestions)
    .innerJoin(users, eq(captionSuggestions.authorId, users.id))
    .where(eq(captionSuggestions.lineId, lineId))
    .orderBy(desc(captionSuggestions.createdAt));

  const suggestionIds = suggestions.map((item) => item.id);
  const votes = suggestionIds.length
    ? await db
      .select({
        suggestionId: captionSuggestionVotes.suggestionId,
        kind: captionSuggestionVotes.kind,
      })
      .from(captionSuggestionVotes)
      .where(inArray(captionSuggestionVotes.suggestionId, suggestionIds))
    : [];

  return Response.json({
    suggestions: suggestions.map((suggestion) => ({
      ...suggestion,
      support: votes.filter((vote) => vote.suggestionId === suggestion.id && vote.kind === "support").length,
      oppose: votes.filter((vote) => vote.suggestionId === suggestion.id && vote.kind === "oppose").length,
    })),
  });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "caption_suggestion.create", 10, 86_400);
    const payload = await request.json() as { heroId?: string; lineId?: string; text?: string };
    const heroId = payload.heroId?.trim() || "";
    const lineId = payload.lineId?.trim() || "";
    const text = payload.text?.trim() || "";
    const hero = getHero(heroId);
    const line = getHeroLine(heroId, lineId);
    if (!hero || !line) {
      return Response.json({ error: "Herói ou caption não encontrada." }, { status: 404 });
    }
    if (text.length < 2 || text.length > 500) {
      return Response.json({ error: "A sugestão deve ter entre 2 e 500 caracteres." }, { status: 400 });
    }

    const terminologyWarnings = validateTerminology(line.captionEn, text);
    if (terminologyWarnings.length) {
      return Response.json({
        error: "Use os nomes oficiais de heróis e itens destacados.",
        terminologyWarnings,
      }, { status: 422 });
    }

    const id = crypto.randomUUID();
    const db = getDb();
    await db.insert(captionSuggestions).values({
      id,
      heroId,
      lineId,
      authorId: user.id,
      text,
      status: "open",
      terminologyWarnings: "[]",
    });
    await db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorId: user.id,
      action: "caption_suggestion.create",
      subjectType: "caption_suggestion",
      subjectId: id,
      metadata: JSON.stringify({ heroId, lineId }),
    });
    return Response.json({ suggestion: { id, text, status: "open" } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível salvar a sugestão." }, { status: 500 });
  }
}
