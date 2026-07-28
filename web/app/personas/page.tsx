import { HeroCatalog } from "@/components/HeroCatalog";
import { HeroCard } from "@/components/HeroCard";
import { CURRENT_BUILD, personas } from "@/lib/catalog";
import { getCurrentTranslations } from "@/lib/current-translations";

export const metadata = { title: "Personas e variantes de voz" };

export default function PersonasPage() {
  const personaCount = personas.filter((item) => item.type === "persona").length;
  const total = personas.reduce((sum, item) => sum + item.total, 0);
  const translated = personas.reduce(
    (sum, item) =>
      sum + Object.keys(getCurrentTranslations(item.id, item.lines)).length,
    0,
  );
  return (
    <>
      <main className="page-shell">
        <div className="page-intro">
          <div>
            <p className="eyebrow">INVENTÁRIO SEPARADO · BUILD {CURRENT_BUILD}</p>
            <h1 className="page-title">Personas e variantes</h1>
          </div>
          <p>
            Vozes alternativas ficam separadas do herói-base para preservar o
            elenco, a identidade da interpretação e o progresso real de cada pack.
          </p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><strong>{personas.length}</strong><span>grupos catalogados</span></div>
          <div className="stat-card"><strong>{personaCount}</strong><span>personas identificadas</span></div>
          <div className="stat-card"><strong>{total.toLocaleString("pt-BR")}</strong><span>captions oficiais EN</span></div>
          <div className="stat-card"><strong>{translated.toLocaleString("pt-BR")}</strong><span>captions com PT-BR disponível</span></div>
        </div>
        <HeroCatalog
          label="personas e variantes"
          entries={personas.map(({ id, name }) => ({ id, name }))}
        >
          {personas.map((persona) => (
            <HeroCard key={persona.id} persona={persona} />
          ))}
        </HeroCatalog>
      </main>
    </>
  );
}
