import { Header } from "@/components/Header";
import { LineBrowser } from "@/components/LineBrowser";
import { announcerSource, CURRENT_BUILD, getHeroLines } from "@/lib/catalog";
import { countTranslationSources, getCurrentTranslations } from "@/lib/current-translations";

export const metadata = {
  title: "Narrador padrão",
  description: "Captions e traduções PT-BR do narrador padrão do Dota 2.",
};

export default function AnnouncerPage() {
  const lines = getHeroLines("announcer");
  const translations = getCurrentTranslations("announcer", lines);
  const sources = countTranslationSources(translations);

  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div>
            <p className="eyebrow">NARRADOR PADRÃO · BUILD {CURRENT_BUILD}</p>
            <h1 className="page-title">{announcerSource.name}</h1>
          </div>
          <p>Inglês oficial e PT-BR reunidos na mesma lista. A origem segue a prioridade oficial, comunidade e sugerida; usuários Steam podem sugerir alterações em cada linha.</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card"><strong>{lines.length.toLocaleString("pt-BR")}</strong><span>captions em inglês</span></div>
          <div className="stat-card"><strong>{Object.keys(translations).length.toLocaleString("pt-BR")}</strong><span>captions PT-BR incluídas</span></div>
          <div className="stat-card"><strong>{sources.official.toLocaleString("pt-BR")}</strong><span>oficiais PT-BR</span></div>
          <div className="stat-card"><strong>{sources.automatic.toLocaleString("pt-BR")}</strong><span>traduções sugeridas</span></div>
        </div>
        <LineBrowser heroId="announcer" lines={lines} translations={translations} />
      </main>
    </>
  );
}
