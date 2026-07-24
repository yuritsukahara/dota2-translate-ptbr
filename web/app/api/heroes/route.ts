import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { heroes, lines } from "@/db/schema";
import { ensureCatalogSeeded } from "@/lib/database";

export async function GET() {
  await ensureCatalogSeeded();
  const db = getDb();
  const rows = await db
    .select({
      id: heroes.id,
      name: heroes.name,
      buildId: heroes.buildId,
      total: count(lines.id),
    })
    .from(heroes)
    .leftJoin(lines, eq(lines.heroId, heroes.id))
    .groupBy(heroes.id);
  return Response.json({ heroes: rows });
}
