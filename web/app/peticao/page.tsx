import { cookies } from "next/headers";
import { and, count, desc, eq, gt } from "drizzle-orm";
import { Header } from "@/components/Header";
import { PetitionPageContent } from "@/components/PetitionPageContent";
import { getDb } from "@/db";
import { petitionSignatures, sessions, users } from "@/db/schema";
import { fetchPublicSteamProfile } from "@/lib/steam-profile";

export const metadata = {
  title: "Petição por áudio oficial em português brasileiro",
  description: "Uma carta aberta da comunidade brasileira pedindo à Valve vozes oficiais de Dota 2 em PT-BR.",
};

export default async function PetitionPage() {
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
  const sessionId = (await cookies()).get("dt_session")?.value;
  let alreadySigned = false;
  if (sessionId) {
    const [signed] = await db
      .select({ id: petitionSignatures.id })
      .from(petitionSignatures)
      .innerJoin(sessions, eq(petitionSignatures.userId, sessions.userId))
      .where(and(
        eq(sessions.id, sessionId),
        gt(sessions.expiresAt, new Date().toISOString()),
      ))
      .limit(1);
    alreadySigned = Boolean(signed);
  }

  return (
    <>
      <Header />
      <PetitionPageContent total={total} recent={recent} alreadySigned={alreadySigned} />
    </>
  );
}
