import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { categoryLabel, getLine } from "@/lib/catalog";

export default async function LinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const line = getLine(id);
  if (!line) notFound();
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">AXE · {categoryLabel(line.category).toUpperCase()}</p><h1 className="page-title" style={{ fontSize: 50 }}>{line.id}</h1></div>
          <Link className="button button-ghost" href={`/enviar?linha=${line.id}`}>Propor tradução</Link>
        </div>
        <div className="detail-grid">
          <section className="detail-panel">
            <h2>Propostas da comunidade</h2>
            <div className="empty-card">
              <p className="eyebrow">ABERTA PARA CONTRIBUIÇÃO</p>
              <p>Ainda não existe uma tradução liberada para votação. A primeira proposta passa por triagem antes de aparecer aqui.</p>
              <Link className="text-link" href={`/enviar?linha=${line.id}`}>Enviar a primeira proposta →</Link>
            </div>
          </section>
          <aside className="side-panel">
            <p className="eyebrow">METADADOS</p>
            <dl className="metadata-list">
              <dt>Herói</dt><dd>Axe</dd>
              <dt>Categoria</dt><dd>{categoryLabel(line.category)}</dd>
              <dt>Asset</dt><dd>{line.assetPath}</dd>
              <dt>Tradução</dt><dd>Aguardando</dd>
              <dt>Áudio</dt><dd>Não gravado</dd>
              <dt>Release</dt><dd>Não incluído</dd>
            </dl>
          </aside>
        </div>
      </main>
    </>
  );
}
