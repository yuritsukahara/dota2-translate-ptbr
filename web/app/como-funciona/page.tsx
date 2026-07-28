import Link from "@/src/compat/link";
import { HowItWorks } from "@/components/HowItWorks";

export const metadata = {
  title: "Como o projeto funciona",
  description:
    "Explicação visual do catálogo, das captions, dos packs de voz e das contribuições via Steam.",
};

export default function HowItWorksPage() {
  return (
    <>
      <main className="page-shell explainer-page">
        <div className="page-intro">
          <div>
            <p className="eyebrow">DO ARQUIVO À COMUNIDADE</p>
            <h1 className="page-title">Como o projeto funciona</h1>
          </div>
          <p>
            O portal organiza o material oficial encontrado no Dota local,
            oferece versões PT-BR identificadas e prepara cada pack para uma
            contribuição comunitária rastreável.
          </p>
        </div>

        <HowItWorks />

        <section className="explainer-safety">
          <div>
            <p className="eyebrow">UM HERÓI, UMA VOZ</p>
            <h2>O pack pertence ao intérprete escolhido.</h2>
          </div>
          <div className="policy-grid">
            <article className="policy-card">
              <p className="eyebrow">ENVIO ORGANIZADO</p>
              <h3>Pasta completa</h3>
              <p>O intérprete autenticado pela Steam envia um link do Google Drive com um WAV nomeado para cada caption falada.</p>
            </article>
            <article className="policy-card">
              <p className="eyebrow">PACK INDIVISÍVEL</p>
              <h3>Um intérprete</h3>
              <p>Uma única interpretação cobre o herói inteiro. Linhas de diferentes autores nunca são misturadas no mesmo pack.</p>
            </article>
          </div>
        </section>

        <div className="explainer-actions">
          <Link className="button button-primary" href="/enviar">
            Enviar um pack de voz
          </Link>
        </div>
      </main>
    </>
  );
}
