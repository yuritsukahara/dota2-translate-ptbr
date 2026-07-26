import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LineBrowser } from "@/components/LineBrowser";
import { CastingPanel } from "@/components/CastingPanel";
import {
  CURRENT_BUILD,
  getHero,
  getHeroLines,
  heroes,
} from "@/lib/catalog";

export function generateStaticParams() {
  return heroes.map((hero) => ({ id: hero.id }));
}

export default async function HeroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hero = getHero(id);
  if (!hero) notFound();
  const lines = getHeroLines(id);

  return (
    <>
      <Header />
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
              O projeto só usará texto PT-BR quando existir caption oficial no cliente.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href={`/audicoes/${hero.id}`}>Enviar audição de 5 linhas</Link>
              <a className="button button-ghost" href={`https://liquipedia.net/dota2/${encodeURIComponent(hero.name.replaceAll(" ", "_"))}/Responses`}>Referência da wiki</a>
            </div>
          </div>
        </div>
        <div className="stats-grid hero-caption-stats">
          <div className="stat-card"><strong>{hero.total}</strong><span>captions oficiais EN</span></div>
          <div className="stat-card"><strong>{hero.officialBrazilianCaptions}</strong><span>captions oficiais PT-BR</span></div>
          <div className="stat-card"><strong>{hero.officialBrazilianCaptions}</strong><span>linhas elegíveis para dublagem</span></div>
        </div>
        <CastingPanel heroId={hero.id} heroName={hero.name} sampleLines={lines.slice(0, 5)} />
        <div className="detail-grid official-caption-note" style={{ marginBottom: 50 }}>
          <section className="detail-panel">
            <h2>Fonte das captions</h2>
            <p className="form-note">Inglês vem de <code>subtitles_{hero.voiceDirectory}_english.txt</code>. Não existe arquivo equivalente PT-BR para este herói no build atual; por isso traduções comunitárias antigas não aparecem como caption oficial.</p>
          </section>
          <aside className="side-panel">
            <p className="eyebrow">SOM ORIGINAL</p>
            <p className="form-note">O catálogo registra o caminho do asset original no VPK local. O portal não redistribui as gravações da Valve.</p>
          </aside>
        </div>
        <LineBrowser lines={lines} />
      </main>
    </>
  );
}
