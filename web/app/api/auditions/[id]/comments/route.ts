import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditionComments, auditions, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { assertRateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await getDb()
    .select({
      id: auditionComments.id,
      body: auditionComments.body,
      author: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: auditionComments.createdAt,
    })
    .from(auditionComments)
    .innerJoin(users, eq(auditionComments.authorId, users.id))
    .where(eq(auditionComments.auditionId, id))
    .orderBy(desc(auditionComments.createdAt));
  return Response.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(request);
    await assertRateLimit(user.id, "audition.comment", 10, 60);
    const { id } = await params;
    const payload = (await request.json()) as { body?: string };
    const body = payload.body?.trim() || "";
    if (body.length < 2 || body.length > 1000) {
      return Response.json({ error: "Comentário deve ter entre 2 e 1000 caracteres." }, { status: 400 });
    }
    const db = getDb();
    const [audition] = await db.select({ id: auditions.id }).from(auditions).where(eq(auditions.id, id)).limit(1);
    if (!audition) return Response.json({ error: "Audição não encontrada." }, { status: 404 });
    const commentId = crypto.randomUUID();
    await db.insert(auditionComments).values({
      id: commentId,
      auditionId: id,
      authorId: user.id,
      body,
    });
    return Response.json({ comment: { id: commentId, body } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível comentar." }, { status: 500 });
  }
}
