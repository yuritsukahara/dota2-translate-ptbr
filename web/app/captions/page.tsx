import Link from "next/link";
import { Header } from "@/components/Header";
import { CaptionBrowser } from "@/components/CaptionBrowser";
import {
  CURRENT_BUILD,
  CURRENT_BUILD_DATE,
  getHero,
  getHeroLines,
  heroes,
} from "@/lib/catalog";

export const metadata = { title: "Captions oficiais" };

export default async function CaptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ heroi?: string }>;
}) {
  const requestedHero = (await searchParams).heroi || "axe";
  const hero = getHero(requestedHero) || getHero("axe")!;
  const lines = getHeroLines(hero.id);

  return (
    <>
      <Header />
      <main className="page-shell captions-page">
        <div className="page-intro">
          <div>
            <p className="eyebrow">TEXTO OFICIAL · BUILD {CURRENT_BUILD}</p>
            <h1 className="page-title">Captions</h1>
          </div>
          <p>
            Uma área dedicada somente aos textos encontrados nos arquivos oficiais
            do jogo. Nenhuma tradução comunitária é apresentada como caption da Valve.
          </p>
        </div>

        <section className="caption-control-panel">
          <form method="get" action="/captions">
            <label htmlFor="caption-hero">Escolha o herói</label>
            <select className="field" id="caption-hero" name="heroi" defaultValue={hero.id}>
              {heroes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.officialEnglishCaptions} EN · {item.officialBrazilianCaptions} PT-BR
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
          PT-BR ausente significa que este build não publicou uma caption brasileira
          para a linha. Isso não é uma solicitação de tradução nem um campo editável.
          <Link href={`/heroes/${hero.id}`}> Ver página completa de {hero.name} →</Link>
        </div>

        <CaptionBrowser lines={lines} />
      </main>
    </>
  );
}
