import { Header } from "@/components/Header";
import { HeroCard } from "@/components/HeroCard";
import { heroes } from "@/lib/catalog";

export const metadata = { title: "Heróis" };

export default function HeroesPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">INVENTÁRIO BASE</p><h1 className="page-title">Heróis</h1></div>
          <p>Cada campanha começa com um inventário extraído do cliente, fixado a uma versão e separado de personas, narradores e eventos.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><strong>1</strong><span>campanha ativa</span></div>
          <div className="stat-card"><strong>285</strong><span>slots base catalogados</span></div>
          <div className="stat-card"><strong>0%</strong><span>revisado e lançado</span></div>
        </div>
        <div className="hero-card-grid">{heroes.map((hero) => <HeroCard key={hero.id} hero={hero} />)}</div>
      </main>
    </>
  );
}
