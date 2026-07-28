import Link from "next/link";
import Image from "next/image";
import {
  getHeroLines,
  type Hero,
  type PersonaVariant,
} from "@/lib/catalog";
import { countTranslationSources, getCurrentTranslations } from "@/lib/current-translations";

type HeroCardProps =
  | { hero: Hero; persona?: never }
  | { hero?: never; persona: PersonaVariant };

export function HeroCard(props: HeroCardProps) {
  const card = "persona" in props
    ? {
        entry: props.persona,
        href: `/personas/${props.persona.id}`,
        lines: props.persona.lines,
        totalCaptions: props.persona.total,
        typeLabel:
          props.persona.type === "persona" ? "PERSONA" : "VARIANTE DE VOZ",
        voicePrefix: props.persona.prefixes.join(" + "),
      }
    : {
        entry: props.hero,
        href: `/heroes/${props.hero.id}`,
        lines: getHeroLines(props.hero.id),
        totalCaptions: props.hero.officialEnglishCaptions,
        typeLabel: "BASE",
        voicePrefix: props.hero.voicePrefix || "—",
      };
  const {
    entry,
    href,
    lines,
    totalCaptions,
    typeLabel,
    voicePrefix,
  } = card;
  const translations = getCurrentTranslations(entry.id, lines);
  const translated = Object.keys(translations).length;
  const sources = countTranslationSources(translations);
  const coverage = totalCaptions
    ? Math.round((translated / totalCaptions) * 100)
    : 0;
  const body = (
    <>
      <div className="hero-card-visual">
        <Image
          className="hero-card-image"
          src={entry.imageUrl}
          alt=""
          width={320}
          height={180}
          unoptimized={entry.imageUrl.startsWith("/")}
        />
        <span className="hero-card-status">{typeLabel}</span>
      </div>
      <div className="hero-card-content">
        <div className="hero-card-heading">
          <h3>{entry.name}</h3>
          <span className="hero-card-coverage">{coverage}%</span>
        </div>
        <p className="hero-card-caption-count">
          <strong>{translated}</strong>
          <span>
            de {totalCaptions} captions PT-BR incluídas
          </span>
        </p>
        <div
          className="hero-card-progress"
          role="progressbar"
          aria-label={`Cobertura de captions PT-BR de ${entry.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={coverage}
        >
          <span style={{ width: `${coverage}%` }} />
        </div>
        <div className="hero-card-sources" aria-label="Origem das traduções">
          <span>
            <b>{sources.official}</b> oficial
          </span>
          <span>
            <b>{sources.community}</b> comunidade
          </span>
          <span>
            <b>{sources.automatic}</b> sugerida
          </span>
        </div>
        <div className="hero-card-footer">
          <span>{entry.total} voicelines</span>
          <span>{voicePrefix}</span>
        </div>
      </div>
    </>
  );
  return <Link className="hero-card active" href={href}>{body}</Link>;
}
