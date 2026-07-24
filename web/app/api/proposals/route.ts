import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { auditEvents, lines, proposals, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ensureCatalogSeeded } from "@/lib/database";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/csrf";

export async function GET(request: Request) {
  await ensureCatalogSeeded();
  const url = new URL(request.url);
  const lineId = url.searchParams.get("line");
  if (!lineId) return Response.json({ error: "line é obrigatório" }, { status: 400 });
  const rows = await getDb()
    .select({
      id: proposals.id,
      kind: proposals.kind,
      text: proposals.text,
      status: proposals.status,
      author: users.displayName,
      createdAt: proposals.createdAt,
    })
    .from(proposals)
    .innerJoin(users, eq(proposals.authorId, users.id))
    .where(eq(proposals.lineId, lineId))
    .orderBy(desc(proposals.createdAt));
  return Response.json({ proposals: rows });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await ensureCatalogSeeded();
    const user = await requireUser(request);
    await assertRateLimit(user.id, "proposal.create", 5, 86_400);
    const payload = await request.json() as { lineId?: string; kind?: string; text?: string };
    const lineId = payload.lineId?.trim() || "";
    const text = payload.text?.trim() || "";
    if (payload.kind !== "translation" || !lineId || text.length < 2 || text.length > 500) {
      return Response.json({ error: "Proposta inválida." }, { status: 400 });
    }
    const db = getDb();
    const [line] = await db.select({ id: lines.id }).from(lines).where(eq(lines.id, lineId)).limit(1);
    if (!line) return Response.json({ error: "Fala não encontrada." }, { status: 404 });
    const id = crypto.randomUUID();
    await db.insert(proposals).values({ id, lineId, authorId: user.id, kind: "translation", text, status: "pending" });
    await db.insert(auditEvents).values({ id: crypto.randomUUID(), actorId: user.id, action: "proposal.create", subjectType: "proposal", subjectId: id });
    return Response.json({ proposal: { id, status: "pending" } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Não foi possível salvar a proposta." }, { status: 500 });
  }
}
