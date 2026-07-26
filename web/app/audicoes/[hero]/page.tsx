import { notFound } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { AuditionForm } from "@/components/AuditionForm";
import { getHero, getHeroLines, heroes } from "@/lib/catalog";
import { getCurrentTranslations } from "@/lib/current-translations";

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
  const allLines = getHeroLines(heroId);
  const translations = getCurrentTranslations(heroId, allLines);
  const lines = allLines
    .filter((line) => translations[line.id])
    .slice(0, 5)
    .map((line) => ({ ...line, captionPtBr: translations[line.id].text }));

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
              A prévia usa exatamente cinco traduções PT-BR incluídas. O vencedor
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
            <p className="eyebrow">TRADUÇÃO EM ANDAMENTO</p>
            <h2>A seleção ainda não pode receber áudio</h2>
            <p>
              O catálogo ainda não possui cinco traduções PT-BR para {hero.name}.
              A audição abre automaticamente assim que o Codex concluir cinco linhas.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
