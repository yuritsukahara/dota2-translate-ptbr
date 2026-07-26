import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditionClips, auditions, auditEvents, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getHero, getHeroLines } from "@/lib/catalog";
import { assertSameOrigin } from "@/lib/csrf";
import { assertRateLimit } from "@/lib/rate-limit";
import { runtimeEnv } from "@/lib/runtime-env";
import { inspectWav } from "@/lib/wav";

export async function GET(request: Request) {
  const heroId = new URL(request.url).searchParams.get("hero") || "";
  if (!getHero(heroId)) {
    return Response.json({ error: "Herói não encontrado." }, { status: 404 });
  }
  const rows = await getDb()
    .select({
      id: auditions.id,
      heroId: auditions.heroId,
      authorId: auditions.authorId,
      author: users.displayName,
      avatarUrl: users.avatarUrl,
      credit: auditions.credit,
      status: auditions.status,
      openedAt: auditions.openedAt,
      createdAt: auditions.createdAt,
    })
    .from(auditions)
    .innerJoin(users, eq(auditions.authorId, users.id))
    .where(eq(auditions.heroId, heroId))
    .orderBy(desc(auditions.createdAt));
  return Response.json({ auditions: rows });
}

export async function POST(request: Request) {
  const uploadedKeys: string[] = [];
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "audition.create", 2, 86_400);
    const data = await request.formData();
    const heroId = String(data.get("heroId") || "").trim();
    const credit = String(data.get("credit") || "").trim();
    const consent = data.get("consent") === "true";
    const files = data.getAll("clips");
    const lineIds = JSON.parse(String(data.get("lineIds") || "[]")) as string[];
    const hero = getHero(heroId);
    const eligible = new Map(
      getHeroLines(heroId)
        .filter((line) => line.captionPtBr)
        .map((line) => [line.id, line])
    );

    if (
      !hero ||
      !credit ||
      !consent ||
      files.length !== 5 ||
      lineIds.length !== 5 ||
      new Set(lineIds).size !== 5 ||
      lineIds.some((lineId) => !eligible.has(lineId)) ||
      files.some((file) => !(file instanceof File))
    ) {
      return Response.json(
        { error: "A audição exige cinco linhas oficiais distintas, crédito e consentimento." },
        { status: 400 }
      );
    }

    const auditionId = crypto.randomUUID();
    const clips = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index] as File;
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Cada arquivo deve ter no máximo 10 MB.");
      }
      const bytes = await file.arrayBuffer();
      const info = inspectWav(bytes);
      const key = `pending/auditions/${heroId}/${auditionId}/${index + 1}.wav`;
      await runtimeEnv.AUDIO.put(key, bytes, {
        httpMetadata: { contentType: "audio/wav" },
        customMetadata: {
          uploader: user.id,
          heroId,
          lineId: lineIds[index],
          license: "CC-BY-4.0",
        },
      });
      uploadedKeys.push(key);
      clips.push({
        auditionId,
        lineId: lineIds[index],
        position: index + 1,
        audioObjectKey: key,
        durationMs: info.durationMs,
        sampleRate: info.sampleRate,
      });
    }

    const db = getDb();
    await db.batch([
      db.insert(auditions).values({
        id: auditionId,
        heroId,
        authorId: user.id,
        credit,
        status: "pending",
      }),
      ...clips.map((clip) => db.insert(auditionClips).values(clip)),
      db.insert(auditEvents).values({
        id: crypto.randomUUID(),
        actorId: user.id,
        action: "audition.create",
        subjectType: "audition",
        subjectId: auditionId,
        metadata: JSON.stringify({ heroId, clipCount: 5 }),
      }),
    ]);
    return Response.json(
      { audition: { id: auditionId, heroId, status: "pending" } },
      { status: 201 }
    );
  } catch (error) {
    if (uploadedKeys.length) await runtimeEnv.AUDIO.delete(uploadedKeys);
    if (error instanceof Response) return error;
    return Response.json(
      { error: error instanceof Error ? error.message : "Audição inválida." },
      { status: 400 }
    );
  }
}
