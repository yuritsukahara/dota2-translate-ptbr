import Link from "@/src/compat/link";
import Image from "@/src/compat/image";

type FeaturedCatalogCardProps = {
  entry: {
    id: string;
    name: string;
    imageUrl: string;
    total: number;
    translated: number;
    official: number;
    community: number;
    suggested: number;
    voicePrefix: string;
  };
  kind: "hero" | "persona";
};

export function FeaturedCatalogCard({
  entry,
  kind,
}: FeaturedCatalogCardProps) {
  const coverage = entry.total
    ? Math.round((entry.translated / entry.total) * 100)
    : 0;
  const href =
    kind === "persona" ? `/personas/${entry.id}` : `/heroes/${entry.id}`;
  const typeLabel = kind === "persona" ? "PERSONA" : "BASE";

  return (
    <Link className="hero-card active" href={href}>
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
          <strong>{entry.translated}</strong>
          <span>de {entry.total} captions PT-BR incluídas</span>
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
            <b>{entry.official}</b> oficial
          </span>
          <span>
            <b>{entry.community}</b> comunidade
          </span>
          <span>
            <b>{entry.suggested}</b> sugerida
          </span>
        </div>
        <div className="hero-card-footer">
          <span>{entry.total} voicelines</span>
          <span>{entry.voicePrefix}</span>
        </div>
      </div>
    </Link>
  );
}
