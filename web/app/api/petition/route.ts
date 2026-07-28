import { count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { petitionSignatures, users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { fetchPublicSteamProfile } from "@/lib/steam-profile";

export async function GET(request: Request) {
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(petitionSignatures);
  const recentRows = await db
    .select({
      id: petitionSignatures.id,
      name: users.displayName,
      avatar: users.avatarUrl,
      steamId: users.steamId,
    })
    .from(petitionSignatures)
    .innerJoin(users, eq(petitionSignatures.userId, users.id))
    .orderBy(desc(petitionSignatures.createdAt))
    .limit(12);
  const recent = await Promise.all(recentRows.map(async (signature) => {
    if (signature.avatar && !signature.name.startsWith("Jogador Steam ")) return signature;
    const publicProfile = await fetchPublicSteamProfile(signature.steamId);
    return {
      ...signature,
      name: publicProfile?.personaname || signature.name,
      avatar: publicProfile?.avatarfull || signature.avatar,
    };
  }));
  const user = await currentUser(request);
  let alreadySigned = false;
  if (user) {
    const [signed] = await db
      .select({ id: petitionSignatures.id })
      .from(petitionSignatures)
      .where(eq(petitionSignatures.userId, user.id))
      .limit(1);
    alreadySigned = Boolean(signed);
  }
  return Response.json(
    { total, recent, alreadySigned },
    { headers: { "cache-control": "no-store, max-age=0" } },
  );
}
