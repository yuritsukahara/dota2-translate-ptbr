import { Header } from "@/components/Header";
import Image from "next/image";
export const metadata = { title: "Créditos e direitos" };

export default function CreditsPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div>
            <p className="eyebrow">TRANSPARÊNCIA</p>
            <h1 className="page-title">Créditos</h1>
          </div>
          <p>
            Todo texto e interpretação publicados carregam autoria, licença e
            histórico de contribuições.
          </p>
        </div>
        <div className="detail-grid">
          <section className="detail-panel">
            <h2>Projeto inicial</h2>
            <p>
              Estrutura, automação e catálogo mantidos pela comunidade Dublagem
              Brasileira Dota 2.
            </p>
            <h2 style={{ marginTop: 42 }}>Cobertura geral</h2>
            <p>
              O inventário reúne todos os heróis base e o narrador padrão em um
              build identificado do jogo.
            </p>
            <p>
              Traduções e packs comunitários permanecem creditados aos seus
              respectivos autores.
            </p>
            <Image
              className="credit-logo"
              src="/logos/tangoleague-logo-banner-full-color.webp"
              alt="Tango League — Liga Brasileira de Dota 2"
              unoptimized
            />
          </section>
          <aside className="side-panel">
            <p className="eyebrow">LICENÇAS</p>
            <p className="form-note">
              Código: MIT
              <br />
              Textos e gravações comunitárias: CC BY 4.0.
            </p>
            <p className="form-note">
              Dota 2, personagens e assets originais pertencem à Valve e aos
              respectivos licenciantes. Este projeto não é afiliado nem
              endossado pela Valve.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
