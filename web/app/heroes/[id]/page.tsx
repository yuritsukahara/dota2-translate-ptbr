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
import { getCurrentTranslations } from "@/lib/current-translations";

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
  const translations = getCurrentTranslations(id, lines);
  const includedCount = Object.keys(translations).length;
  const automaticCount = Object.values(translations).filter((item) => item.source === "automatic").length;
  const fandomResponsePage = `https://dota2.fandom.com/wiki/${encodeURIComponent(hero.name.replaceAll(" ", "_"))}/Responses`;

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
              Traduções automáticas entram diretamente no catálogo PT-BR; a
              comunidade pode sugerir alternativas sem bloquear a inclusão.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href={`/audicoes/${hero.id}`}>Enviar audição de 5 linhas</Link>
              <Link className="button button-ghost" href={`/captions?heroi=${hero.id}`}>Ver somente captions</Link>
              <a className="button button-ghost" href={fandomResponsePage}>Responses no Fandom</a>
            </div>
          </div>
        </div>
        <div className="stats-grid hero-caption-stats">
          <div className="stat-card"><strong>{hero.total}</strong><span>captions oficiais EN</span></div>
          <div className="stat-card"><strong>{includedCount}</strong><span>traduções PT-BR incluídas</span></div>
          <div className="stat-card"><strong>{automaticCount}</strong><span>traduções automáticas</span></div>
        </div>
        <CastingPanel heroId={hero.id} heroName={hero.name} sampleLines={lines.slice(0, 5)} translations={translations} />
        <div className="detail-grid official-caption-note" style={{ marginBottom: 50 }}>
          <section className="detail-panel">
            <h2>Fonte das captions</h2>
            <p className="form-note">Inglês vem de <code>subtitles_{hero.voiceDirectory}_english.txt</code>. Quando não há texto brasileiro no jogo, o catálogo inclui a tradução do projeto ou a versão automática do Codex, sempre com a origem identificada.</p>
          </section>
          <aside className="side-panel">
            <p className="eyebrow">SOM ORIGINAL</p>
            <p className="form-note">O player tenta abrir o arquivo individual hospedado pelo Fandom. Quando ele não existe, permanece o caminho do asset no VPK local e o link para a página Responses.</p>
          </aside>
        </div>
        <LineBrowser lines={lines} translations={translations} responsePage={fandomResponsePage} />
      </main>
    </>
  );
}
