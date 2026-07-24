import Link from "next/link";
import { percent } from "@/lib/catalog";

type Hero = {
  id: string; name: string; subtitle: string; total: number;
  translated: number; recorded: number; reviewed: number; active: boolean;
};

export function HeroCard({ hero }: { hero: Hero }) {
  const body = (
    <>
      <span className="hero-card-number">{hero.name.slice(0, 1)}</span>
      <span className="hero-card-status">{hero.active ? "● CAMPANHA ATIVA" : "EM PREPARAÇÃO"}</span>
      <h3>{hero.name}</h3>
      <p>{hero.subtitle}</p>
      <div className="hero-card-footer">
        <span>{hero.total || "—"} falas</span>
        <span>{percent(hero.reviewed, hero.total)}% completo</span>
      </div>
    </>
  );
  return hero.active
    ? <Link className="hero-card active" href={`/heroes/${hero.id}`}>{body}</Link>
    : <article className="hero-card disabled">{body}</article>;
}
