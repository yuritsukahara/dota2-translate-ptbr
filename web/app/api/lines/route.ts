import { and, eq, like } from "drizzle-orm";
import { getDb } from "@/db";
import { lines } from "@/db/schema";
import { ensureCatalogSeeded } from "@/lib/database";

export async function GET(request: Request) {
  await ensureCatalogSeeded();
  const url = new URL(request.url);
  const heroId = url.searchParams.get("hero") || "axe";
  const query = url.searchParams.get("q")?.trim();
  const filters = [eq(lines.heroId, heroId)];
  if (query) filters.push(like(lines.id, `%${query}%`));
  const rows = await getDb().select().from(lines).where(and(...filters)).limit(1000);
  return Response.json({ lines: rows });
}
