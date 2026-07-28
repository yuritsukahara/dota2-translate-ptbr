import Link from "@/src/compat/link";
import Image from "@/src/compat/image";
import { heroes, personas } from "@/lib/catalog";

export const metadata = {
  title: "Packs de Voz",
  description: "Envie um pack completo de vozes em PT-BR por uma pasta compartilhada do Google Drive.",
};

export default function SubmitPage() {
  const packSources = [
    ...heroes.map((hero) => ({
      id: hero.id,
      name: hero.name,
      imageUrl: hero.imageUrl,
      typeLabel: "Base",
    })),
    ...personas.map((persona) => ({
      id: persona.id,
      name: persona.name,
      imageUrl: persona.imageUrl,
      typeLabel:
        persona.type === "persona" ? "Persona" : "Variante de voz",
    })),
  ].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));

  return (
    <>
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">VOZES DA COMUNIDADE</p><h1 className="page-title">Packs de Voz</h1></div>
          <p>Escolha um herói, persona ou variante de voz, grave todas as falas com caption e envie o link de uma pasta organizada no Google Drive. O crédito, a autorização e as diretrizes ficam vinculados ao envio.</p>
        </div>
        <section className="casting-panel">
          <p className="eyebrow">COMO ENVIAR</p>
          <h2>Uma pasta. Um personagem. Uma identidade.</h2>
          <p>Você mantém os arquivos no seu próprio Google Drive. O portal armazena apenas o link, seu crédito e suas observações. As falas de autores diferentes nunca são misturadas no mesmo pack.</p>
          <div className="casting-flow">
            <span>01 · escolha a voz</span>
            <span>02 · grave o pack completo</span>
            <span>03 · organize a pasta</span>
            <span>04 · envie o link</span>
          </div>
        </section>
        <section className="pack-picker-section">
          <div className="section-heading compact">
            <div><p className="eyebrow">ESCOLHA O PERSONAGEM</p><h2>Enviar um pack</h2></div>
            <p>
              {packSources.length} opções: {heroes.length} heróis base e{" "}
              {personas.length} personas ou variantes.
            </p>
          </div>
          <div className="pack-hero-grid">
            {packSources.map((source) => (
              <Link href={`/packs/${source.id}`} key={source.id}>
                <Image
                  src={source.imageUrl}
                  alt=""
                  width={128}
                  height={72}
                  unoptimized={source.imageUrl.startsWith("/")}
                />
                <strong>{source.name}</strong>
                <small>{source.typeLabel}</small>
                <span>Enviar pack →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
