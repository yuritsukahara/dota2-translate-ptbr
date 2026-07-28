import { getDb } from "@/db";
import { auditEvents, captionSuggestions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getCaptionSource, getHeroLine } from "@/lib/catalog";
import { assertSameOrigin } from "@/lib/csrf";
import { assertRateLimit } from "@/lib/rate-limit";
import { validateTerminology } from "@/lib/terminology";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "caption_suggestion.create", 10, 86_400);
    const payload = await request.json() as {
      heroId?: string;
      lineId?: string;
      text?: string;
    };
    const heroId = payload.heroId?.trim() || "";
    const lineId = payload.lineId?.trim() || "";
    const text = payload.text?.trim() || "";
    const hero = getCaptionSource(heroId);
    const line = getHeroLine(heroId, lineId);

    if (!hero || !line) {
      return Response.json(
        { error: "Herói ou caption não encontrada." },
        { status: 404 },
      );
    }
    if (text.length < 2 || text.length > 500) {
      return Response.json(
        { error: "A sugestão deve ter entre 2 e 500 caracteres." },
        { status: 400 },
      );
    }

    const terminologyWarnings = validateTerminology(line.captionEn, text);
    if (terminologyWarnings.length) {
      return Response.json(
        {
          error: "Use os nomes oficiais de heróis e itens destacados.",
          terminologyWarnings,
        },
        { status: 422 },
      );
    }

    const id = crypto.randomUUID();
    const db = getDb();
    await db.batch([
      db.insert(captionSuggestions).values({
        id,
        heroId,
        lineId,
        authorId: user.id,
        text,
      }),
      db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: user.id,
        action: "caption_suggestion.create",
        subjectType: "caption_suggestion",
        subjectId: id,
        metadata: JSON.stringify({ heroId, lineId }),
      }),
    ]);
    return Response.json(
      { suggestion: { id, text } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: "Não foi possível salvar a sugestão." },
      { status: 500 },
    );
  }
}
