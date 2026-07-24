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
              <p className="eyebrow">v0.1.0 · LABORATÓRIO DO AXE</p>
              <h2>285 vozes-guia</h2>
              <p>Protótipo técnico com WAVs gerados pelo projeto, addon mínimo e instalador compilável. Não contém áudio original da Valve.</p>
            </div>
            <a className="button button-primary" href="https://github.com/yuritsukahara/dota2-translate-ptbr/releases/tag/v0.1.0">Ver no GitHub</a>
          </article>
        </div>
        <div className="mode-grid">
          <article className="mode-card">
            <p className="eyebrow">MODO SUPORTADO</p>
            <h3>Addon oficial</h3>
            <p>Instala em <code>dota_addons</code>, compila com os Workshop Tools locais e roda em Custom Game.</p>
          </article>
          <article className="mode-card lab">
            <p className="eyebrow">LABORATÓRIO · DESATIVADO</p>
            <h3>Cliente normal</h3>
            <p>Só será liberado para builds verificados quando a montagem reversível funcionar sem bypass, injeção ou alteração de executáveis.</p>
          </article>
        </div>
      </main>
    </>
  );
}
