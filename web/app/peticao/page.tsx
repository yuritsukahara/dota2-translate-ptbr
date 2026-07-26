import { cookies } from "next/headers";
import Image from "next/image";
import { count, desc, eq } from "drizzle-orm";
import { Header } from "@/components/Header";
import { PetitionButton } from "@/components/PetitionButton";
import { getDb } from "@/db";
import { petitionSignatures, sessions, users } from "@/db/schema";

export const metadata = {
  title: "Petição por áudio oficial em português brasileiro",
  description: "Uma carta aberta da comunidade brasileira pedindo à Valve vozes oficiais de Dota 2 em PT-BR.",
};

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
            <p className="eyebrow">CARTA ABERTA DA COMUNIDADE DOTA BRASIL</p>
            <h1>Valve, o Brasil quer ouvir Dota 2 em português.</h1>
            <p className="petition-lead">
              Nós já vivemos Dota em português: nas partidas, transmissões, campeonatos,
              piadas e amizades. Agora queremos ouvir os heróis que amamos com vozes
              brasileiras oficiais, direção profissional e o mesmo cuidado dado a cada personalidade.
            </p>
            <PetitionButton alreadySigned={alreadySigned} />
          </div>
          <aside className="petition-counter">
            <strong>{total.toLocaleString("pt-BR")}</strong>
            <span>jogadores verificados pela Steam</span>
            <p>Meta inicial</p>
            <b>10.000</b>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, total / 100)}%` }} /></div>
          </aside>
        </section>

        <section className="section petition-letter">
          <p className="eyebrow">CARTA ABERTA</p>
          <h2>O jogo já fala com o Brasil. Queremos ouvi-lo também.</h2>
          <div>
            <p>À equipe de Dota 2 na Valve,</p>
            <p>Há anos a comunidade brasileira transforma Dota em cultura. Narramos campeonatos, ensinamos novos jogadores, criamos conteúdo, lotamos transmissões e continuamos voltando para mais uma partida. Nosso idioma já faz parte dessa história.</p>
            <p>Uma opção oficial de áudio em português brasileiro tornaria o universo do jogo mais próximo, acessível e memorável. Não queremos apagar as vozes originais: queremos poder escolher uma interpretação brasileira feita com elenco profissional, direção consistente e respeito ao humor, à força e às particularidades de cada personagem.</p>
            <p>Por isso pedimos que a Valve avalie produzir um pacote oficial com as voicelines dos heróis e do narrador padrão em PT-BR. Este portal organiza a demanda, mede a participação e mostra que existe uma comunidade pronta para celebrar e apoiar esse trabalho.</p>
            <p>Este é um projeto independente. Não falamos em nome da Valve e não presumimos qualquer compromisso de implementação. Oferecemos esta carta e nossas assinaturas como um convite claro: escutem a comunidade que há tanto tempo mantém Dota vivo no Brasil.</p>
            <p>Com paixão, respeito e uma vontade enorme de ouvir “Primeiro Sangue” do nosso jeito,<br /><strong>Comunidade Dota 2 Brasil</strong></p>
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
