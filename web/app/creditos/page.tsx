import { Header } from "@/components/Header";

export const metadata = { title: "Créditos e direitos" };

export default function CreditsPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">TRANSPARÊNCIA</p><h1 className="page-title">Créditos</h1></div>
          <p>Todo texto e interpretação publicados carregam autoria, licença e histórico de revisão.</p>
        </div>
        <div className="detail-grid">
          <section className="detail-panel">
            <h2>Projeto inicial</h2>
            <p>Estrutura, automação e laboratório inicial mantidos pela comunidade Dota 2 Translate PT-BR.</p>
            <h2 style={{ marginTop: 42 }}>Campanha do Axe</h2>
            <p>Inventário técnico: 285 nomes de assets detectados no cliente local.</p>
            <p>Tradução final e elenco: ainda em seleção comunitária.</p>
          </section>
          <aside className="side-panel">
            <p className="eyebrow">LICENÇAS</p>
            <p className="form-note">Código: MIT<br />Textos e gravações comunitárias: CC BY 4.0.</p>
            <p className="form-note">Dota 2, personagens e assets originais pertencem à Valve e aos respectivos licenciantes. Este projeto não é afiliado nem endossado pela Valve.</p>
          </aside>
        </div>
      </main>
    </>
  );
}
