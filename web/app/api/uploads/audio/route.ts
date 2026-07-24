import { getDb } from "@/db";
import { auditEvents, proposals } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { runtimeEnv } from "@/lib/runtime-env";
import { inspectWav } from "@/lib/wav";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "audio.upload", 5, 86_400);
    const data = await request.formData();
    const file = data.get("file");
    const lineId = String(data.get("lineId") || "").trim();
    const credit = String(data.get("credit") || "").trim();
    const consent = data.get("consent") === "true";
    if (!(file instanceof File) || !lineId || !credit || !consent) {
      return Response.json({ error: "Arquivo, fala, crédito e consentimento são obrigatórios." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) return Response.json({ error: "O arquivo excede 10 MB." }, { status: 413 });
    const bytes = await file.arrayBuffer();
    const info = inspectWav(bytes);
    const id = crypto.randomUUID();
    const key = `pending/${lineId}/${id}.wav`;
    await runtimeEnv.AUDIO.put(key, bytes, {
      httpMetadata: { contentType: "audio/wav" },
      customMetadata: { uploader: user.id, lineId, license: "CC-BY-4.0" },
    });
    const db = getDb();
    await db.insert(proposals).values({
      id, lineId, authorId: user.id, kind: "audio", audioObjectKey: key,
      audioDurationMs: info.durationMs, audioSampleRate: info.sampleRate,
      credit, license: "CC-BY-4.0", status: "pending",
    });
    await db.insert(auditEvents).values({ id: crypto.randomUUID(), actorId: user.id, action: "audio.upload", subjectType: "proposal", subjectId: id });
    return Response.json({ proposal: { id, status: "pending", ...info } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Upload inválido.";
    return Response.json({ error: message }, { status: 400 });
  }
}
