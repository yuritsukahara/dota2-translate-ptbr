import { notFound } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { AuditionForm } from "@/components/AuditionForm";
import { getHero, getHeroLines, heroes } from "@/lib/catalog";

export function generateStaticParams() {
  return heroes.map((hero) => ({ hero: hero.id }));
}

export default async function AuditionPage({
  params,
}: {
  params: Promise<{ hero: string }>;
}) {
  const { hero: heroId } = await params;
  const hero = getHero(heroId);
  if (!hero) notFound();
  const lines = getHeroLines(heroId)
    .filter((line) => line.captionPtBr)
    .slice(0, 5);

  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="hero-detail-head audition-head">
          <Image src={hero.imageUrl} alt="" width={616} height={346} />
          <div>
            <p className="eyebrow">AUDIÇÃO · {hero.name.toUpperCase()}</p>
            <h1 className="page-title">Seja a voz do pack</h1>
            <p>
              A prévia usa exatamente cinco captions oficiais PT-BR. O vencedor
              aprovado assume todas as voicelines deste herói; o pack nunca
              mistura intérpretes.
            </p>
          </div>
        </div>
        {lines.length === 5 ? (
          <section className="form-card">
            <h2>Enviar prévia</h2>
            <AuditionForm heroId={hero.id} lines={lines} />
          </section>
        ) : (
          <section className="empty-card casting-blocked">
            <p className="eyebrow">AGUARDANDO FONTE OFICIAL</p>
            <h2>A seleção ainda não pode receber áudio</h2>
            <p>
              Este build possui {hero.officialBrazilianCaptions} captions
              oficiais PT-BR para {hero.name}. A audição abre automaticamente
              quando houver pelo menos cinco linhas oficiais elegíveis.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
