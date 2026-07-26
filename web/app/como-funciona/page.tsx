import Link from "next/link";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";

export const metadata = {
  title: "Como o mod funciona",
  description:
    "Explicação visual do fluxo de tradução, compilação, instalação e fallback das vozes comunitárias.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="page-shell explainer-page">
        <div className="page-intro">
          <div>
            <p className="eyebrow">DO TEXTO AO JOGO</p>
            <h1 className="page-title">Como o mod funciona</h1>
          </div>
          <p>
            A camada brasileira substitui somente as vozes que já foram
            aprovadas. Todo o resto continua vindo da instalação original do
            Dota.
          </p>
        </div>

        <HowItWorks />

        <section className="explainer-safety">
          <div>
            <p className="eyebrow">UM HERÓI, UMA VOZ</p>
            <h2>O pack pertence ao intérprete escolhido.</h2>
          </div>
          <div className="mode-grid casting-policy-grid">
            <article className="mode-card lab">
              <p className="eyebrow">AUDIÇÃO PADRONIZADA</p>
              <h3>Cinco linhas</h3>
              <p>Todos interpretam o mesmo roteiro para permitir uma votação comparável e transparente.</p>
            </article>
            <article className="mode-card lab">
              <p className="eyebrow">PACK INDIVISÍVEL</p>
              <h3>Um intérprete</h3>
              <p>O vencedor grava o herói inteiro. Linhas de diferentes autores nunca são misturadas no mesmo pack.</p>
            </article>
          </div>
        </section>

        <div className="explainer-actions">
          <Link className="button button-primary" href="/heroes/axe">
            Ver as falas do Axe
          </Link>
          <Link className="button button-ghost" href="/releases">
            Ver instalação e restauração
          </Link>
        </div>
      </main>
    </>
  );
}
