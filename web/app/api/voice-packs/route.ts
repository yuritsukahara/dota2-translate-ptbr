import { getDb } from "@/db";
import { auditEvents, voicePackSubmissions } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getHero } from "@/lib/catalog";
import { assertSameOrigin } from "@/lib/csrf";
import { normalizeGoogleDriveFolderUrl } from "@/lib/google-drive";
import { assertRateLimit } from "@/lib/rate-limit";

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

    if (!getHero(heroId)) {
      return Response.json({ error: "Herói não encontrado." }, { status: 404 });
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
        status: "pending",
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

    return Response.json({ submission: { id, heroId, status: "pending" } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Não foi possível enviar o pack." },
      { status: 400 },
    );
  }
}
