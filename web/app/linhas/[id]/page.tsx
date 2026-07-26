import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { OriginalAudio } from "@/components/OriginalAudio";
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
        </div>
        <div className="detail-grid">
          <section className="detail-panel">
            <p className="eyebrow">SOM ORIGINAL</p>
            <OriginalAudio
              lineId={line.id}
              responsePage="https://dota2.fandom.com/wiki/Axe/Responses"
            />
            <p className="eyebrow">LEGENDA OFICIAL EM INGLÊS</p>
            <blockquote className="source-caption">
              {line.captionEn}
            </blockquote>
            <p className="eyebrow">CAPTION OFICIAL PT-BR</p>
            <blockquote className="source-caption ptbr">{line.captionPtBr || "Não publicada pela Valve neste build."}</blockquote>
          </section>
          <aside className="side-panel">
            <p className="eyebrow">METADADOS</p>
            <dl className="metadata-list">
              <dt>Herói</dt><dd>Axe</dd>
              <dt>Categoria</dt><dd>{categoryLabel(line.category)}</dd>
              <dt>Asset</dt><dd>{line.assetPath}</dd>
              <dt>Token</dt><dd>{line.captionToken}</dd>
              <dt>Fonte EN</dt><dd>Caption oficial do VPK</dd>
              <dt>Fonte PT-BR</dt><dd>{line.captionPtBr ? "Caption oficial do VPK" : "Ausente"}</dd>
              <dt>Som original</dt><dd>Disponível na instalação local do Dota</dd>
              <dt>Elegibilidade</dt><dd>{line.captionPtBr ? "Pode entrar no pack" : "Aguardando caption oficial"}</dd>
            </dl>
          </aside>
        </div>
      </main>
    </>
  );
}
