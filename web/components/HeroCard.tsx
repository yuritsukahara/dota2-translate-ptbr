import Link from "next/link";
import Image from "next/image";
import { getHeroLines, type Hero } from "@/lib/catalog";
import { countTranslationSources, getCurrentTranslations } from "@/lib/current-translations";

export function HeroCard({ hero }: { hero: Hero }) {
  const translations = getCurrentTranslations(hero.id, getHeroLines(hero.id));
  const translated = Object.keys(translations).length;
  const sources = countTranslationSources(translations);
  const body = (
    <>
      <Image className="hero-card-image" src={hero.imageUrl} alt="" width={256} height={144} />
      <span className="hero-card-status">INVENTÁRIO OFICIAL</span>
      <h3>{hero.name}</h3>
      <p><strong>{translated}</strong> de {hero.officialEnglishCaptions} captions PT-BR incluídas</p>
      <div className="hero-card-sources" aria-label="Origem das traduções">
        <span><b>{sources.official}</b> oficial</span>
        <span><b>{sources.community}</b> comunidade</span>
        <span><b>{sources.automatic}</b> automática</span>
      </div>
      <div className="hero-card-footer">
        <span>{hero.total} voicelines</span>
        <span>{hero.voicePrefix || "—"}</span>
      </div>
    </>
  );
  return <Link className="hero-card active" href={`/heroes/${hero.id}`}>{body}</Link>;
}
