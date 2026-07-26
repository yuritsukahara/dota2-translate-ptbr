import { Header } from "@/components/Header";

export const metadata = { title: "Releases e instalador" };

export default function ReleasesPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">PACOTES VERIFICADOS</p><h1 className="page-title">Instalar</h1></div>
          <p>Releases incluem manifesto, hash SHA-256 e cobertura exata. Slots incompletos continuam usando o áudio original já instalado pelo jogo.</p>
        </div>
        <div className="release-list">
          <article className="release-card">
            <div>
              <p className="eyebrow">PRÓXIMA RELEASE · AXE</p>
              <h2>Pack comunitário completo</h2>
              <p>A release será aberta depois que um intérprete vencer a audição, gravar todo o herói e concluir as revisões linguística e técnica.</p>
            </div>
            <a className="button button-primary" href="https://github.com/yuritsukahara/dota2-translate-ptbr/releases/tag/v0.1.0">Ver no GitHub</a>
          </article>
        </div>
        <div className="notice" style={{ marginTop: 34 }}>
          O instalador do cliente normal permanece desativado até que a montagem seja comprovadamente reversível em um build conhecido, sem injeção, bypass ou alteração de executáveis.
        </div>
      </main>
    </>
  );
}
