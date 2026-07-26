import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Header } from "@/components/Header";
import { getDb } from "@/db";
import { users, voicePacks, voicePackSubmissions } from "@/db/schema";
import { getHero } from "@/lib/catalog";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user || user.blockedAt) notFound();
  const submissions = await db
    .select()
    .from(voicePackSubmissions)
    .where(eq(voicePackSubmissions.authorId, id))
    .orderBy(desc(voicePackSubmissions.createdAt));
  const packs = await db
    .select()
    .from(voicePacks)
    .where(eq(voicePacks.authorId, id))
    .orderBy(desc(voicePacks.createdAt));

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="profile-head">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" width={120} height={120} />
          ) : (
            <div className="profile-avatar" aria-hidden="true">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="eyebrow">PERFIL DA COMUNIDADE</p>
            <h1 className="page-title">{user.displayName}</h1>
            <p>{packs.length} packs aprovados · {submissions.length} packs enviados</p>
          </div>
        </section>

        <section className="profile-section">
          <div className="section-heading compact">
            <div><p className="eyebrow">PACKS DE VOZ</p><h2>Heróis assumidos</h2></div>
          </div>
          <div className="pack-grid">
            {packs.length ? packs.map((pack) => {
              const hero = getHero(pack.heroId);
              return (
                <Link className="pack-card" href={`/heroes/${pack.heroId}`} key={pack.id}>
                  {hero && <Image src={hero.imageUrl} alt="" width={300} height={169} />}
                  <div>
                    <span className="status-pill open">{pack.status}</span>
                    <h3>{hero?.name || pack.heroId}</h3>
                    <p>{pack.submittedLines} de {pack.totalLines} linhas enviadas</p>
                  </div>
                </Link>
              );
            }) : <div className="empty-card"><p>Nenhum pack atribuído ainda.</p></div>}
          </div>
        </section>

        <section className="profile-section">
          <div className="section-heading compact">
            <div><p className="eyebrow">ENVIOS</p><h2>Packs enviados</h2></div>
          </div>
          <div className="release-list">
            {submissions.length ? submissions.map((submission) => {
              const hero = getHero(submission.heroId);
              return (
                <article className="release-card" key={submission.id}>
                  <div>
                    <p className="eyebrow">{submission.status}</p>
                    <h2>{hero?.name || submission.heroId}</h2>
                    <p>Pack completo via Google Drive · crédito: {submission.credit}</p>
                  </div>
                  <Link className="button button-ghost" href={`/heroes/${submission.heroId}`}>Ver herói</Link>
                </article>
              );
            }) : <div className="empty-card"><p>Nenhum pack enviado.</p></div>}
          </div>
        </section>
      </main>
    </>
  );
}
