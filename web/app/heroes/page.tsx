import { Header } from "@/components/Header";
import { HeroCard } from "@/components/HeroCard";
import { HeroCatalog } from "@/components/HeroCatalog";
import { CURRENT_BUILD, getHeroLines, heroes } from "@/lib/catalog";
import { countTranslationSources, getCurrentTranslations } from "@/lib/current-translations";

export const metadata = { title: "Heróis" };

export default function HeroesPage() {
  const translatedTotal = heroes.reduce(
    (sum, hero) => sum + Object.keys(getCurrentTranslations(hero.id, getHeroLines(hero.id))).length,
    0,
  );
  const automaticTotal = heroes.reduce(
    (sum, hero) => sum + countTranslationSources(getCurrentTranslations(hero.id, getHeroLines(hero.id))).automatic,
    0,
  );
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">INVENTÁRIO BASE · BUILD {CURRENT_BUILD}</p><h1 className="page-title">Heróis</h1></div>
          <p>Todos os heróis estão em ordem alfabética e possuem uma página própria com o inglês oficial e as traduções PT-BR já incluídas pelo projeto.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><strong>{heroes.length}</strong><span>heróis no grid</span></div>
          <div className="stat-card"><strong>{heroes.reduce((sum, hero) => sum + hero.total, 0).toLocaleString("pt-BR")}</strong><span>voicelines com caption EN</span></div>
          <div className="stat-card"><strong>{translatedTotal.toLocaleString("pt-BR")}</strong><span>traduções PT-BR incluídas</span></div>
          <div className="stat-card"><strong>{automaticTotal.toLocaleString("pt-BR")}</strong><span>captions geradas automaticamente</span></div>
        </div>
        <HeroCatalog entries={heroes.map(({ id, name }) => ({ id, name }))}>
          {heroes.map((hero) => <HeroCard key={hero.id} hero={hero} />)}
        </HeroCatalog>
      </main>
    </>
  );
}
