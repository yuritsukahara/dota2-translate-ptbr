import { getDb } from "@/db";
import { auditEvents, voicePackSubmissions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import heroCatalog from "@/data/heroes.json";
import voicePackVariantIds from "@/data/voice-pack-variant-ids.json";
import { assertSameOrigin } from "@/lib/csrf";
import { normalizeGoogleDriveFolderUrl } from "@/lib/google-drive";
import { assertRateLimit } from "@/lib/rate-limit";
import { runtimeEnv } from "@/lib/runtime-env";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "voice_pack.submit", 3, 86_400);

    const body = await request.json() as {
      heroId?: string;
      credit?: string;
      driveFolderUrl?: string;
      notes?: string;
      ownsVoice?: boolean;
      acceptsLicense?: boolean;
      followedGuidelines?: boolean;
    };
    const heroId = String(body.heroId || "").trim();
    const credit = String(body.credit || "").trim();
    const notes = String(body.notes || "").trim();
    const driveFolderUrl = normalizeGoogleDriveFolderUrl(String(body.driveFolderUrl || ""));

    const isBaseHero = heroCatalog.heroes.some((hero) => hero.id === heroId);
    const isVariant = voicePackVariantIds.includes(heroId);
    if (!isBaseHero && !isVariant) {
      return Response.json({ error: "Personagem ou variante não encontrado." }, { status: 404 });
    }
    if (credit.length < 2 || credit.length > 100) {
      return Response.json({ error: "Informe um crédito público entre 2 e 100 caracteres." }, { status: 400 });
    }
    if (!driveFolderUrl) {
      return Response.json({ error: "Envie o link de uma pasta válida do Google Drive." }, { status: 400 });
    }
    if (notes.length > 1_000) {
      return Response.json({ error: "As observações devem ter no máximo 1.000 caracteres." }, { status: 400 });
    }
    if (!body.ownsVoice || !body.acceptsLicense || !body.followedGuidelines) {
      return Response.json({ error: "Confirme autoria, licença e cumprimento das diretrizes." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const db = getDb();
    await db.batch([
      db.insert(voicePackSubmissions).values({
        id,
        heroId,
        authorId: user.id,
        credit,
        driveFolderUrl,
        notes,
      }),
      db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: user.id,
        action: "voice_pack.submit",
        subjectType: "voice_pack_submission",
        subjectId: id,
        metadata: JSON.stringify({ heroId, driveProvider: "google_drive" }),
      }),
    ]);
    try {
      await runtimeEnv.SUBMISSIONS.put(
        `voice-packs/${user.steamId}/${id}.json`,
        JSON.stringify({
          id,
          heroId,
          authorId: user.id,
          steamId: user.steamId,
          credit,
          driveFolderUrl,
          notes,
          submittedAt: new Date().toISOString(),
        }),
        {
          httpMetadata: { contentType: "application/json; charset=utf-8" },
          customMetadata: { heroId, authorId: user.id },
        },
      );
    } catch {
      // O registro D1 continua sendo a fonte de verdade se o espelho R2 falhar.
    }

    return Response.json({ submission: { id, heroId } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível enviar o pack." },
      { status: 400 },
    );
  }
}
