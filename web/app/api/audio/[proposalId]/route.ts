import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { proposals } from "@/db/schema";
import { runtimeEnv } from "@/lib/runtime-env";

export async function GET(_request: Request, { params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await params;
  const [proposal] = await getDb()
    .select({ key: proposals.audioObjectKey, status: proposals.status })
    .from(proposals)
    .where(eq(proposals.id, proposalId))
    .limit(1);
  if (!proposal?.key || !["open", "eligible", "approved"].includes(proposal.status)) {
    return Response.json({ error: "Áudio não disponível." }, { status: 404 });
  }
  const object = await runtimeEnv.AUDIO.get(proposal.key);
  if (!object) return Response.json({ error: "Áudio não encontrado." }, { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("cache-control", proposal.status === "approved" ? "public, max-age=86400" : "private, max-age=60");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
