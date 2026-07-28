import { useParams } from "@/src/compat/navigation";
import Image from "@/src/compat/image";
import Link from "@/src/compat/link";
import { LineBrowser } from "@/components/LineBrowser";
import { VoicePackPanel } from "@/components/VoicePackPanel";
import {
  CURRENT_BUILD,
  getHero,
  getHeroLines,
  getHeroPersonas,
} from "@/lib/catalog";
import { HeroCard } from "@/components/HeroCard";
import { countTranslationSources, getCurrentTranslations } from "@/lib/current-translations";

export default function HeroPage() {
  const { id = "" } = useParams<{ id: string }>();
  const hero = getHero(id);
  if (!hero) return null;
  const lines = getHeroLines(id);
  const translations = getCurrentTranslations(id, lines);
  const heroPersonas = getHeroPersonas(id);
  const includedCount = Object.keys(translations).length;
  const sources = countTranslationSources(translations);

  return (
    <>
      <main className="page-shell">
        <div className="hero-detail-head">
          <Image src={hero.imageUrl} alt={`Retrato de ${hero.name}`} width={616} height={346} priority={hero.id === "axe"} />
          <div>
            <p className="eyebrow">
              INVENTÁRIO OFICIAL · BUILD {CURRENT_BUILD}
            </p>
            <h1 className="page-title">{hero.name}</h1>
            <p>
              {hero.total} voicelines reconciliadas com captions oficiais em inglês.
              Traduções sugeridas entram diretamente no catálogo PT-BR; a
              comunidade pode sugerir alternativas sem bloquear a inclusão.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href={`/packs/${hero.id}`}>Enviar pack de voz</Link>
            </div>
          </div>
        </div>
        <div className="stats-grid hero-caption-stats">
          <div className="stat-card"><strong>{includedCount}</strong><span>captions PT-BR incluídas</span></div>
          <div className="stat-card"><strong>{sources.official}</strong><span>oficiais do jogo</span></div>
          <div className="stat-card"><strong>{sources.community}</strong><span>traduzidas pela comunidade</span></div>
          <div className="stat-card"><strong>{sources.automatic}</strong><span>traduções sugeridas</span></div>
        </div>
        <VoicePackPanel heroId={hero.id} heroName={hero.name} />
        {heroPersonas.length > 0 && (
          <section className="hero-variants-section">
            <div className="section-heading compact">
              <div>
                <p className="eyebrow">ELENCOS SEPARADOS</p>
                <h2>Personas e variantes de {hero.name}</h2>
              </div>
              <Link className="text-link" href="/personas">Ver inventário completo <span>→</span></Link>
            </div>
            <div className="hero-card-grid">
              {heroPersonas.map((persona) => (
                <HeroCard key={persona.id} persona={persona} />
              ))}
            </div>
          </section>
        )}
        <div className="detail-grid official-caption-note" style={{ marginBottom: 50 }}>
          <section className="detail-panel">
            <h2>Fonte das captions</h2>
            <p className="form-note">Inglês vem de <code>subtitles_{hero.voiceDirectory}_english.txt</code>. Para PT-BR, usamos primeiro a caption oficial; na ausência dela, a tradução da comunidade; e, por último, uma tradução sugerida. Tudo o que o projeto já traduziu permanece incluído com a origem identificada.</p>
          </section>
          <aside className="side-panel">
            <p className="eyebrow">SOM ORIGINAL</p>
            <p className="form-note">O player usa somente o MP3 extraído do VPK instalado nesta máquina. Nenhuma fonte externa é necessária.</p>
          </aside>
        </div>
        <LineBrowser heroId={hero.id} lines={lines} translations={translations} />
      </main>
    </>
  );
}
