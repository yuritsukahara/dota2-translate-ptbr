import { Header } from "@/components/Header";

export const metadata = { title: "Moderação" };

export default function ModerationPage() {
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">ÁREA DE CURADORIA</p><h1 className="page-title">Moderação</h1></div>
          <p>A fila preserva uploads pendentes fora da área pública até a validação de formato, consentimento e licença.</p>
        </div>
        <div className="notice">Entre com uma conta Steam que possua papel de revisor, moderador ou administrador para acessar a fila.</div>
        <div className="stats-grid">
          <div className="stat-card"><strong>0</strong><span>aguardando triagem</span></div>
          <div className="stat-card"><strong>0</strong><span>elegíveis</span></div>
          <div className="stat-card"><strong>2</strong><span>revisões exigidas</span></div>
        </div>
      </main>
    </>
  );
}
