import { notFound } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { LineBrowser } from "@/components/LineBrowser";
import { ProgressRail } from "@/components/ProgressRail";
import {
  CURRENT_BUILD,
  getHero,
  getHeroLines,
  heroes,
  percent,
} from "@/lib/catalog";

export function generateStaticParams() {
  return heroes.map((hero) => ({ id: hero.id }));
}

export default async function HeroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hero = getHero(id);
  if (!hero) notFound();
  const lines = getHeroLines(id);

  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="hero-detail-head">
          <Image src={hero.imageUrl} alt={`Retrato de ${hero.name}`} width={616} height={346} priority={hero.id === "axe"} />
          <div>
            <p className="eyebrow">
              {hero.active ? "CAMPANHA ATIVA" : "INVENTÁRIO"} · BUILD {CURRENT_BUILD}
            </p>
            <h1 className="page-title">{hero.name}</h1>
            <p>
              {hero.hasOfficialEnglishCaptions
                ? "Há legenda oficial em inglês para orientar a tradução comunitária."
                : "A fonte oficial de legendas deste herói ainda precisa ser reconciliada."}
            </p>
          </div>
        </div>
        <div className="detail-grid" style={{ marginBottom: 50 }}>
          <section className="detail-panel">
            <h2>Progresso verificável</h2>
            <ProgressRail label="Rascunhos PT-BR disponíveis" value={percent(hero.drafted, hero.total)} />
            <ProgressRail label="Tradução aprovada" value={percent(hero.translated, hero.total)} />
            <ProgressRail label="Áudio gravado" value={percent(hero.recorded, hero.total)} tone="rust" />
            <ProgressRail label="Revisado e lançado" value={percent(hero.reviewed, hero.total)} tone="red" />
          </section>
          <aside className="side-panel">
            <p className="eyebrow">FALAS VERBAIS COM LEGENDA OFICIAL</p>
            <h2 style={{ fontSize: 54, margin: 0 }}>{hero.total || "—"}</h2>
            <p className="form-note">
              {hero.assetTotal || "Nenhum"} assets no inventário; vocalizações não verbais e slots sem legenda oficial ficam fora desta campanha.
            </p>
          </aside>
        </div>
        {lines.length ? (
          <LineBrowser lines={lines} />
        ) : (
          <div className="empty-card">
            <p className="eyebrow">PRÓXIMA ETAPA</p>
            <h2>Importação detalhada ainda não iniciada</h2>
            <p>
              A página e o total técnico já existem. O Axe é o primeiro herói com cada fala reconciliada,
              tradução editável e pacote de teste.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
