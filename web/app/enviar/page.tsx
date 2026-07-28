import { Header } from "@/components/Header";
import Link from "next/link";
import Image from "next/image";
import { heroes } from "@/lib/catalog";

export const metadata = {
  title: "Packs de Voz",
  description: "Envie um pack completo de vozes em PT-BR por uma pasta compartilhada do Google Drive.",
};

export default function SubmitPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">VOZES DA COMUNIDADE</p><h1 className="page-title">Packs de Voz</h1></div>
          <p>Escolha um herói, grave todas as falas com caption e envie o link de uma pasta organizada no Google Drive. O crédito, a autorização e as diretrizes ficam vinculados ao envio.</p>
        </div>
        <section className="casting-panel">
          <p className="eyebrow">COMO ENVIAR</p>
          <h2>Uma pasta. Um herói. Uma identidade.</h2>
          <p>Você mantém os arquivos no seu próprio Google Drive. O portal armazena apenas o link, seu crédito e suas observações. As falas de autores diferentes nunca são misturadas no mesmo pack.</p>
          <div className="casting-flow">
            <span>01 · escolha o herói</span>
            <span>02 · grave o pack completo</span>
            <span>03 · organize a pasta</span>
            <span>04 · envie o link</span>
          </div>
        </section>
        <section className="pack-picker-section">
          <div className="section-heading compact">
            <div><p className="eyebrow">ESCOLHA O PERSONAGEM</p><h2>Enviar um pack</h2></div>
            <p>{heroes.length} heróis disponíveis.</p>
          </div>
          <div className="pack-hero-grid">
            {heroes.map((hero) => (
              <Link href={`/packs/${hero.id}`} key={hero.id}>
                <Image src={hero.imageUrl} alt="" width={128} height={72} />
                <strong>{hero.name}</strong>
                <span>Enviar pack →</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
