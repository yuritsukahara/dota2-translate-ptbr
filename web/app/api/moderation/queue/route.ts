import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { proposals, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { hasRequiredRole } from "@/lib/database";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    if (!await hasRequiredRole(user.id, ["language_reviewer", "audio_reviewer", "moderator", "admin"])) {
      return Response.json({ error: "Acesso restrito." }, { status: 403 });
    }
    const rows = await getDb()
      .select({
        id: proposals.id, lineId: proposals.lineId, kind: proposals.kind, text: proposals.text,
        status: proposals.status, credit: proposals.credit, author: users.displayName, createdAt: proposals.createdAt,
      })
      .from(proposals)
      .innerJoin(users, eq(proposals.authorId, users.id))
      .orderBy(desc(proposals.createdAt))
      .limit(100);
    return Response.json({ proposals: rows });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível carregar a fila." }, { status: 500 });
  }
}
