import { cookies } from "next/headers";
import Image from "next/image";
import { count, desc, eq } from "drizzle-orm";
import { Header } from "@/components/Header";
import { PetitionButton } from "@/components/PetitionButton";
import { getDb } from "@/db";
import { petitionSignatures, sessions, users } from "@/db/schema";

export const metadata = { title: "Petição por vozes oficiais em PT-BR" };

export default async function PetitionPage() {
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(petitionSignatures);
  const recent = await db
    .select({ id: petitionSignatures.id, name: users.displayName, avatar: users.avatarUrl })
    .from(petitionSignatures)
    .innerJoin(users, eq(petitionSignatures.userId, users.id))
    .where(eq(petitionSignatures.displayPublicly, true))
    .orderBy(desc(petitionSignatures.createdAt))
    .limit(12);
  const sessionId = (await cookies()).get("dt_session")?.value;
  let alreadySigned = false;
  if (sessionId) {
    const [signed] = await db
      .select({ id: petitionSignatures.id })
      .from(petitionSignatures)
      .innerJoin(sessions, eq(petitionSignatures.userId, sessions.userId))
      .where(eq(sessions.id, sessionId))
      .limit(1);
    alreadySigned = Boolean(signed);
  }

  return (
    <>
      <Header />
      <main>
        <section className="petition-hero">
          <div>
            <p className="eyebrow">UMA VOZ PARA O BRASIL</p>
            <h1>Valve, dê voz oficial em PT-BR aos heróis de Dota 2</h1>
            <p className="petition-lead">
              O Brasil joga, transmite, cria memes, organiza campeonatos e mantém Dota vivo há anos.
              Queremos ouvir essa paixão dentro do jogo, com uma dublagem brasileira oficial, cuidada
              por direção artística profissional e fiel à personalidade de cada herói.
            </p>
            <PetitionButton alreadySigned={alreadySigned} />
          </div>
          <aside className="petition-counter">
            <strong>{total.toLocaleString("pt-BR")}</strong>
            <span>assinaturas verificadas pela Steam</span>
            <p>Meta inicial</p>
            <b>10.000</b>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, total / 100)}%` }} /></div>
          </aside>
        </section>

        <section className="section petition-letter">
          <p className="eyebrow">CARTA ABERTA</p>
          <h2>Não pedimos apenas uma opção no menu. Pedimos reconhecimento.</h2>
          <div>
            <p>À equipe de Dota 2 na Valve,</p>
            <p>A comunidade brasileira construiu uma relação profunda com Dota. Cada partida carrega nosso humor, nossa competitividade, nossas histórias e amizades. O texto em português aproxima o jogo, mas ouvir os heróis em nosso idioma faria essa relação ganhar outra dimensão.</p>
            <p>Pedimos a avaliação de um pacote oficial de áudio em português brasileiro para as voicelines dos heróis, com elenco profissional, direção consistente e participação respeitosa da comunidade na celebração do lançamento.</p>
            <p>Este projeto comunitário cataloga a demanda e demonstra organização. Ele não fala em nome da Valve e não presume uma promessa de implementação. As assinaturas serão entregues por canais públicos adequados, acompanhadas de números verificáveis e desta carta.</p>
            <p>Com paixão e respeito,<br />Comunidade Dota 2 Brasil</p>
          </div>
        </section>

        <section className="section section-dark petition-community">
          <div className="section-heading">
            <div><p className="eyebrow">A COMUNIDADE ESTÁ AQUI</p><h2>Quem já assinou</h2></div>
            <p>Exibimos apenas o nome e avatar públicos da Steam de quem optou por aparecer.</p>
          </div>
          <div className="signature-grid">
            {recent.length ? recent.map((signature) => (
              <article key={signature.id}>
                {signature.avatar ? <Image src={signature.avatar} alt="" width={52} height={52} /> : <span aria-hidden="true">BR</span>}
                <strong>{signature.name}</strong>
              </article>
            )) : <div className="empty-card">Seja a primeira pessoa a assinar.</div>}
          </div>
        </section>
      </main>
    </>
  );
}
