import { Header } from "@/components/Header";
import { LineBrowser } from "@/components/LineBrowser";
import { ProgressRail } from "@/components/ProgressRail";
import { getAxeLines, heroes, percent } from "@/lib/catalog";

export const metadata = { title: "Axe — 285 falas" };

export default function AxePage() {
  const hero = heroes[0];
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">CAMPANHA ATIVA · BUILD 2026-07-23</p><h1 className="page-title">Axe</h1></div>
          <p>Todos os 285 slots da voz base foram catalogados sem extrair ou hospedar o áudio original. Cada linha aguarda tradução, interpretação e revisão.</p>
        </div>
        <div className="detail-grid" style={{ marginBottom: 50 }}>
          <section className="detail-panel">
            <h2>Progresso verificável</h2>
            <ProgressRail label="Tradução aprovada" value={percent(hero.translated, hero.total)} />
            <ProgressRail label="Áudio gravado" value={percent(hero.recorded, hero.total)} tone="rust" />
            <ProgressRail label="Revisado e lançado" value={percent(hero.reviewed, hero.total)} tone="red" />
          </section>
          <aside className="side-panel">
            <p className="eyebrow">DENOMINADOR</p>
            <h2 style={{ fontSize: 54, margin: 0 }}>{hero.total}</h2>
            <p className="form-note">Falas base ativas. Personas, narradores e eventos não entram nesta conta.</p>
          </aside>
        </div>
        <LineBrowser lines={getAxeLines()} />
      </main>
    </>
  );
}
