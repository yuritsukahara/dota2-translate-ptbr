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
            <p className="eyebrow">LEGENDA OFICIAL EM INGLÊS</p>
            <blockquote className="source-caption">
              {line.sourceText || "Este slot não possui legenda oficial associada no arquivo do Axe."}
            </blockquote>
            <p className="eyebrow">RASCUNHO PT-BR</p>
            <blockquote className="source-caption ptbr">{line.ptBrText}</blockquote>
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
              <dt>Fonte</dt><dd>{line.sourceStatus === "official_caption" ? "Legenda oficial EN" : "Ausente"}</dd>
              <dt>Escopo</dt><dd>{line.voiceScope === "spoken" ? "Fala verbal" : "Excluída"}</dd>
              <dt>Direção</dt><dd>{line.voiceDirection || "Não aplicável"}</dd>
              <dt>Tradução</dt><dd>{line.translationStatus === "approved" ? "Aprovada" : "Rascunho"}</dd>
              <dt>Áudio</dt><dd>Não gravado</dd>
              <dt>Release</dt><dd>Não incluído</dd>
            </dl>
          </aside>
        </div>
      </main>
    </>
  );
}
