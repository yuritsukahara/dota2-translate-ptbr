import Link from "next/link";
import Image from "next/image";
import { getHeroLines, type Hero } from "@/lib/catalog";
import { countTranslationSources, getCurrentTranslations } from "@/lib/current-translations";

export function HeroCard({ hero }: { hero: Hero }) {
  const translations = getCurrentTranslations(hero.id, getHeroLines(hero.id));
  const translated = Object.keys(translations).length;
  const sources = countTranslationSources(translations);
  const coverage = hero.officialEnglishCaptions
    ? Math.round((translated / hero.officialEnglishCaptions) * 100)
    : 0;
  const body = (
    <>
      <div className="hero-card-visual">
        <Image className="hero-card-image" src={hero.imageUrl} alt="" width={320} height={180} />
        <span className="hero-card-status">INVENTÁRIO OFICIAL</span>
      </div>
      <div className="hero-card-content">
        <div className="hero-card-heading">
          <h3>{hero.name}</h3>
          <span className="hero-card-coverage">{coverage}%</span>
        </div>
        <p className="hero-card-caption-count">
          <strong>{translated}</strong>
          <span>de {hero.officialEnglishCaptions} captions PT-BR incluídas</span>
        </p>
        <div
          className="hero-card-progress"
          role="progressbar"
          aria-label={`Cobertura de captions PT-BR de ${hero.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={coverage}
        >
          <span style={{ width: `${coverage}%` }} />
        </div>
        <div className="hero-card-sources" aria-label="Origem das traduções">
          <span><b>{sources.official}</b> oficial</span>
          <span><b>{sources.community}</b> comunidade</span>
          <span><b>{sources.automatic}</b> automática</span>
        </div>
        <div className="hero-card-footer">
          <span>{hero.total} voicelines</span>
          <span>{hero.voicePrefix || "—"}</span>
        </div>
      </div>
    </>
  );
  return <Link className="hero-card active" href={`/heroes/${hero.id}`}>{body}</Link>;
}
