import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, voicePackSubmissions } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user || user.blockedAt) {
    return Response.json({ error: "Perfil não encontrado." }, { status: 404 });
  }
  const submissions = await db
    .select({
      id: voicePackSubmissions.id,
      heroId: voicePackSubmissions.heroId,
      credit: voicePackSubmissions.credit,
      createdAt: voicePackSubmissions.createdAt,
    })
    .from(voicePackSubmissions)
    .where(eq(voicePackSubmissions.authorId, id))
    .orderBy(desc(voicePackSubmissions.createdAt));
  return Response.json({
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    submissions,
  });
}
