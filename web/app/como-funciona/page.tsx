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
            <p className="eyebrow">DOIS MODOS, DOIS USOS</p>
            <h2>O conteúdo é o mesmo. A montagem muda.</h2>
          </div>
          <div className="mode-grid">
            <article className="mode-card">
              <p className="eyebrow">MODO OFICIAL</p>
              <h3>Custom Game</h3>
              <p>
                O addon fica em <code>dota_addons</code> e roda como jogo
                personalizado usando o fluxo oficial dos Workshop Tools.
              </p>
            </article>
            <article className="mode-card lab">
              <p className="eyebrow">LABORATÓRIO REVERSÍVEL</p>
              <h3>Cliente normal</h3>
              <p>
                Uma camada <code>dota_brazilian</code> separada é montada pelo
                sistema de idiomas. Não altera executáveis, DLLs nem o VPK base.
              </p>
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
