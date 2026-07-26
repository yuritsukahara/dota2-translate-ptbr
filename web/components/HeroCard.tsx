import Link from "next/link";
import Image from "next/image";
import { type Hero } from "@/lib/catalog";

export function HeroCard({ hero }: { hero: Hero }) {
  const body = (
    <>
      <Image className="hero-card-image" src={hero.imageUrl} alt="" width={256} height={144} />
      <span className="hero-card-status">INVENTÁRIO OFICIAL</span>
      <h3>{hero.name}</h3>
      <p>{hero.officialEnglishCaptions} captions EN · {hero.officialBrazilianCaptions} captions PT-BR</p>
      <div className="hero-card-footer">
        <span>{hero.total} voicelines</span>
        <span>{hero.voicePrefix || "—"}</span>
      </div>
    </>
  );
  return <Link className="hero-card active" href={`/heroes/${hero.id}`}>{body}</Link>;
}
