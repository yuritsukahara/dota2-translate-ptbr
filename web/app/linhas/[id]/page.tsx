import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { OriginalAudio } from "@/components/OriginalAudio";
import { categoryLabel, getCaptionSource, getLineContext } from "@/lib/catalog";
import { currentTranslationLabel, getCurrentTranslations } from "@/lib/current-translations";

export default async function LinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = getLineContext(id);
  if (!context) notFound();
  const { line, sourceId } = context;
  const source = getCaptionSource(sourceId);
  const translation = getCurrentTranslations(sourceId, [line])[line.id];
  const responsePage = sourceId === "announcer"
    ? "https://dota2.fandom.com/wiki/Announcer_responses"
    : `https://dota2.fandom.com/wiki/${encodeURIComponent((source?.name || sourceId).replaceAll(" ", "_"))}/Responses`;
  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="page-intro">
          <div><p className="eyebrow">{source?.name || sourceId} · {categoryLabel(line.category).toUpperCase()}</p><h1 className="page-title" style={{ fontSize: 50 }}>{line.id}</h1></div>
        </div>
        <div className="detail-grid">
          <section className="detail-panel">
            <p className="eyebrow">SOM ORIGINAL</p>
            <OriginalAudio
              lineId={line.id}
              responsePage={responsePage}
            />
            <p className="eyebrow">LEGENDA OFICIAL EM INGLÊS</p>
            <blockquote className="source-caption">
              {line.captionEn}
            </blockquote>
            <p className="eyebrow">LEGENDA PT-BR INCLUÍDA</p>
            <blockquote className="source-caption ptbr">{translation?.text || "Sem versão PT-BR no catálogo."}</blockquote>
          </section>
          <aside className="side-panel">
            <p className="eyebrow">METADADOS</p>
            <dl className="metadata-list">
              <dt>Fonte</dt><dd>{source?.name || sourceId}</dd>
              <dt>Categoria</dt><dd>{categoryLabel(line.category)}</dd>
              <dt>Asset</dt><dd>{line.assetPath}</dd>
              <dt>Token</dt><dd>{line.captionToken}</dd>
              <dt>Fonte EN</dt><dd>Caption oficial do VPK</dd>
              <dt>Fonte PT-BR</dt><dd>{translation ? currentTranslationLabel(translation.source) : "Em geração"}</dd>
              <dt>Som original</dt><dd>Disponível na instalação local do Dota</dd>
              <dt>Inclusão</dt><dd>{translation ? "Incluída no catálogo" : "Sem versão PT-BR"}</dd>
            </dl>
          </aside>
        </div>
      </main>
    </>
  );
}
