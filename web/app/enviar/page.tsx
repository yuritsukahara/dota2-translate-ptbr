import { Header } from "@/components/Header";
import { ProposalForm } from "@/components/ProposalForm";
import { AudioUploadForm } from "@/components/AudioUploadForm";

export const metadata = { title: "Contribuir" };

export default async function SubmitPage({ searchParams }: { searchParams: Promise<{ linha?: string }> }) {
  const { linha } = await searchParams;
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">CONTRIBUIÇÃO ABERTA</p><h1 className="page-title">Dê voz ao projeto</h1></div>
          <p>Traduções e gravações entram em uma fila privada, passam pela verificação de direitos e só então são abertas para votação.</p>
        </div>
        <div className="detail-grid">
          <section className="form-card">
            <h2>Propor tradução</h2>
            <ProposalForm lineId={linha} />
          </section>
          <aside className="side-panel">
            <p className="eyebrow">ANTES DE ENVIAR</p>
            <div className="form-note">
              <p>• Preserve intenção, humor e duração aproximada.</p>
              <p>• Use português brasileiro oral e natural.</p>
              <p>• Não copie traduções sem licença.</p>
              <p>• Não envie áudio extraído do jogo.</p>
              <p>• Voz clonada ou imitação sem consentimento será rejeitada.</p>
            </div>
            <a className="button button-ghost" href="/api/auth/discord/start" style={{ marginTop: 24 }}>Entrar com Discord</a>
          </aside>
        </div>
        <section className="form-card" style={{ marginTop: 24 }}>
          <h2>Enviar interpretação</h2>
          <AudioUploadForm lineId={linha} />
        </section>
      </main>
    </>
  );
}
