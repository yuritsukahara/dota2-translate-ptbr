import Link from "next/link";
import { Header } from "@/components/Header";
import { CaptionBrowser } from "@/components/CaptionBrowser";
import {
  CURRENT_BUILD,
  CURRENT_BUILD_DATE,
  captionSources,
  getCaptionSource,
  getHeroLines,
} from "@/lib/catalog";
import { getCommunityPreviews } from "@/lib/community-preview";

export const metadata = { title: "Tradução comunitária das captions" };

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ heroi?: string }>;
}) {
  const requestedHero = (await searchParams).heroi || "axe";
  const hero = getCaptionSource(requestedHero) || getCaptionSource("axe")!;
  const lines = getHeroLines(hero.id);

  return (
    <>
      <Header />
      <main className="page-shell captions-page">
        <div className="page-intro">
          <div>
            <p className="eyebrow">INGLÊS OFICIAL + TRADUÇÃO COMUNITÁRIA · BUILD {CURRENT_BUILD}</p>
            <h1 className="page-title">Tradução das captions</h1>
          </div>
          <p>
            Compare a caption oficial em inglês, veja uma prévia PT-BR e proponha
            versões melhores. Toda tradução brasileira desta área é identificada
            como comunitária e não oficial.
          </p>
        </div>

        <section className="caption-control-panel">
          <form method="get" action="/captions">
            <label htmlFor="caption-hero">Escolha o herói</label>
            <select className="field" id="caption-hero" name="heroi" defaultValue={hero.id}>
              {captionSources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.kind === "announcer" ? "★ " : ""}{item.name} · {item.officialEnglishCaptions} EN · {item.officialBrazilianCaptions} PT-BR oficial
                </option>
              ))}
            </select>
            <button className="button button-primary" type="submit">Abrir captions</button>
          </form>
          <div>
            <strong>{hero.name}</strong>
            <span>{lines.length} captions inglesas</span>
            <span>{hero.officialBrazilianCaptions} captions PT-BR</span>
            <small>Snapshot de {CURRENT_BUILD_DATE}</small>
          </div>
        </section>

        <div className="notice caption-policy">
          O narrador padrão usa PT-BR oficial quando o arquivo brasileiro possui o token.
          As demais prévias são um ponto de partida para revisão, não texto oficial da Valve.
          Sugestões que mencionam heróis ou itens precisam manter o nome publicado
          nos arquivos oficiais PT-BR do Dota.
          {hero.kind === "hero" && <Link href={`/heroes/${hero.id}`}> Ver página completa de {hero.name} →</Link>}
        </div>

        <CaptionBrowser heroId={hero.id} lines={lines} previews={getCommunityPreviews(hero.id)} />
      </main>
    </>
  );
}
