import Link from "next/link";
import type { OfficialVoiceLine } from "@/lib/catalog";

export function CastingPanel({
  heroId,
  heroName,
  sampleLines,
}: {
  heroId: string;
  heroName: string;
  sampleLines: OfficialVoiceLine[];
}) {
  return (
    <section className="casting-panel">
      <div className="casting-heading">
        <div>
          <p className="eyebrow">ELENCO DA COMUNIDADE</p>
          <h2>Uma voz para todo o pack de {heroName}</h2>
          <p>
            Cada candidato interpreta as mesmas cinco linhas. A comunidade
            comenta, curte, desaprova e vota; depois da revisão, somente o
            vencedor pode completar as demais voicelines do herói.
          </p>
        </div>
        <Link className="button button-primary" href={`/audicoes/${heroId}`}>
          Participar da seleção
        </Link>
      </div>

      <ol className="casting-flow">
        <li><span>01</span><strong>Audição</strong><small>5 linhas obrigatórias</small></li>
        <li><span>02</span><strong>Comunidade</strong><small>votos e comentários</small></li>
        <li><span>03</span><strong>Revisão</strong><small>direitos e qualidade</small></li>
        <li><span>04</span><strong>Pack exclusivo</strong><small>um intérprete por herói</small></li>
      </ol>

      <div className="casting-sample">
        <div>
          <p className="eyebrow">ROTEIRO DA PRÉVIA</p>
          <h3>As cinco linhas da audição</h3>
        </div>
        <div className="casting-lines">
          {sampleLines.map((line, index) => (
            <div key={line.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <code>{line.id}</code>
              <p>{line.captionPtBr || "Aguardando caption oficial PT-BR"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="casting-empty">
        <div>
          <span className="status-pill open">SELEÇÃO ABERTA</span>
          <h3>Ainda não há audições públicas</h3>
          <p>Envios ficam privados durante a triagem e aparecem aqui quando formato, consentimento e licença forem aprovados.</p>
        </div>
        <div className="casting-reactions" aria-label="Reações disponíveis nas audições">
          <span>♡ Curtir</span>
          <span>↓ Desaprovar</span>
          <span>☵ Comentar</span>
          <span>✓ Votar</span>
        </div>
      </div>
    </section>
  );
}
