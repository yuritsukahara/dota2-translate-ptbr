import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { releases } from "@/db/schema";

export async function GET() {
  const rows = await getDb().select().from(releases).orderBy(desc(releases.publishedAt)).limit(20);
  return Response.json({ releases: rows });
}
