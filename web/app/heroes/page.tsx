import { Header } from "@/components/Header";
import { HeroCard } from "@/components/HeroCard";
import { CURRENT_BUILD, heroes } from "@/lib/catalog";

export const metadata = { title: "Heróis" };

export default function HeroesPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">INVENTÁRIO BASE · BUILD {CURRENT_BUILD}</p><h1 className="page-title">Heróis</h1></div>
          <p>Todos os heróis estão em ordem alfabética e possuem uma página própria com voicelines e captions oficiais encontradas no build instalado.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><strong>{heroes.length}</strong><span>heróis no grid</span></div>
          <div className="stat-card"><strong>{heroes.reduce((sum, hero) => sum + hero.total, 0).toLocaleString("pt-BR")}</strong><span>voicelines com caption EN</span></div>
          <div className="stat-card"><strong>{heroes.reduce((sum, hero) => sum + hero.officialBrazilianCaptions, 0)}</strong><span>captions oficiais PT-BR no build</span></div>
        </div>
        <div className="hero-card-grid">{heroes.map((hero) => <HeroCard key={hero.id} hero={hero} />)}</div>
      </main>
    </>
  );
}
