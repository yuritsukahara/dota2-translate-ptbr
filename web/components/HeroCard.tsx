import Link from "next/link";
import Image from "next/image";
import { percent, type Hero } from "@/lib/catalog";

export function HeroCard({ hero }: { hero: Hero }) {
  const body = (
    <>
      <Image className="hero-card-image" src={hero.imageUrl} alt="" width={256} height={144} />
      <span className="hero-card-status">{hero.active ? "● CAMPANHA ATIVA" : "INVENTÁRIO MAPEADO"}</span>
      <h3>{hero.name}</h3>
      <p>{hero.hasOfficialEnglishCaptions ? "Legendas oficiais EN disponíveis" : "Fonte de legenda em verificação"}</p>
      <div className="hero-card-footer">
        <span>{hero.total || "—"} falas</span>
        <span>{percent(hero.reviewed, hero.total)}% completo</span>
      </div>
    </>
  );
  return <Link className={`hero-card ${hero.active ? "active" : ""}`} href={`/heroes/${hero.id}`}>{body}</Link>;
}
