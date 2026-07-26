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
          <p>Os {heroes.length} heróis vêm do OpenDota; o Axe já tem inventário completo e os demais aguardam separação segura de personas e variações no VPK.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><strong>{heroes.length}</strong><span>heróis no grid</span></div>
          <div className="stat-card"><strong>{heroes.filter((hero) => hero.hasOfficialEnglishCaptions).length}</strong><span>com legendas oficiais EN</span></div>
          <div className="stat-card"><strong>0%</strong><span>revisado e lançado</span></div>
        </div>
        <div className="hero-card-grid">{heroes.map((hero) => <HeroCard key={hero.id} hero={hero} />)}</div>
      </main>
    </>
  );
}
