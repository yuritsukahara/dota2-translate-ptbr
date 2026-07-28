import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { LineBrowser } from "@/components/LineBrowser";
import {
  CURRENT_BUILD,
  getPersona,
  getPersonaLines,
  personas,
} from "@/lib/catalog";
import {
  countTranslationSources,
  getCurrentTranslations,
} from "@/lib/current-translations";

export function generateStaticParams() {
  return personas.map((persona) => ({ id: persona.id }));
}

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const persona = getPersona(id);
  if (!persona) notFound();
  const lines = getPersonaLines(id);
  const translations = getCurrentTranslations(id, lines);
  const sources = countTranslationSources(translations);

  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="hero-detail-head persona-detail-head">
          <Image
            src={persona.imageUrl}
            alt={`Retrato de ${persona.name}`}
            width={616}
            height={346}
            unoptimized={persona.imageUrl.startsWith("/")}
          />
          <div>
            <p className="eyebrow">
              {persona.type === "persona" ? "PERSONA" : "VARIANTE DE VOZ"} · BUILD {CURRENT_BUILD}
            </p>
            <h1 className="page-title">{persona.name}</h1>
            <p>
              Inventário separado de {persona.heroName}, identificado pelos
              prefixos técnicos {persona.prefixes.join(", ")}. As traduções
              idênticas ao catálogo-base são reaproveitadas; falas exclusivas
              permanecem pendentes para não inventar texto.
            </p>
            <div className="hero-actions">
              <Link className="button button-ghost" href={`/heroes/${persona.heroId}`}>
                Ver {persona.heroName}
              </Link>
              <Link className="button button-primary" href={`/packs/${persona.heroId}`}>
                Enviar pack de voz
              </Link>
            </div>
          </div>
        </div>
        <div className="stats-grid hero-caption-stats">
          <div className="stat-card"><strong>{persona.total}</strong><span>captions oficiais EN</span></div>
          <div className="stat-card"><strong>{Object.keys(translations).length}</strong><span>captions PT-BR disponíveis</span></div>
          <div className="stat-card"><strong>{sources.official}</strong><span>oficiais do jogo</span></div>
          <div className="stat-card"><strong>{persona.total - Object.keys(translations).length}</strong><span>falas exclusivas pendentes</span></div>
        </div>
        <LineBrowser heroId={persona.id} lines={lines} translations={translations} />
      </main>
    </>
  );
}
