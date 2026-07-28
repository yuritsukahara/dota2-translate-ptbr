import { useEffect, useState } from "react";
import { useParams } from "@/src/compat/navigation";
import Image from "@/src/compat/image";
import Link from "@/src/compat/link";
import { ProfileLoadingSkeleton } from "@/components/LoadingSkeleton";
import { getHero, getVoicePackSource } from "@/lib/catalog";

type PublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  submissions: Array<{
    id: string;
    heroId: string;
    credit: string;
    createdAt: string;
  }>;
};

export default function ProfilePage() {
  const { id = "" } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null | undefined>();

  useEffect(() => {
    let active = true;
    fetch(`/api/profiles/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<PublicProfile> : null)
      .then((payload) => {
        if (active) setProfile(payload);
      })
      .catch(() => {
        if (active) setProfile(null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <main className="page-shell">
        {profile === undefined ? (
          <ProfileLoadingSkeleton />
        ) : !profile ? (
          <div className="empty-card"><p>Perfil não encontrado.</p></div>
        ) : (
          <>
            <section className="profile-head">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" width={120} height={120} unoptimized />
              ) : (
                <div className="profile-avatar" aria-hidden="true">
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="eyebrow">PERFIL DA COMUNIDADE</p>
                <h1 className="page-title">{profile.displayName}</h1>
                <p>{profile.submissions.length} packs enviados</p>
              </div>
            </section>

            <section className="profile-section">
              <div className="section-heading compact">
                <div><p className="eyebrow">PACKS DE VOZ</p><h2>Envios da comunidade</h2></div>
              </div>
              <div className="profile-submission-list">
                {profile.submissions.length ? profile.submissions.map((submission) => {
                  const source = getVoicePackSource(submission.heroId);
                  const isBaseHero = Boolean(getHero(submission.heroId));
                  return (
                    <article className="profile-submission-card" key={submission.id}>
                      <div>
                        <p className="eyebrow">PACK ENVIADO</p>
                        <h2>{source?.name || submission.heroId}</h2>
                        <p>Pack completo · crédito: {submission.credit}</p>
                      </div>
                      <Link
                        className="button button-ghost"
                        href={isBaseHero
                          ? `/heroes/${submission.heroId}`
                          : `/personas/${submission.heroId}`}
                      >
                        Ver personagem
                      </Link>
                    </article>
                  );
                }) : <div className="empty-card"><p>Nenhum pack enviado.</p></div>}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
