import Link from "next/link";

export function VoicePackPanel({
  heroId,
  heroName,
}: {
  heroId: string;
  heroName: string;
}) {
  return (
    <section className="casting-panel">
      <div className="casting-heading">
        <div>
          <p className="eyebrow">PACKS DE VOZ DA COMUNIDADE</p>
          <h2>Sua interpretação completa de {heroName}</h2>
          <p>
            Grave todas as falas com texto, organize os WAVs pelo ID de cada
            caption e compartilhe uma pasta do Google Drive. O pack passa por
            revisão antes de entrar em uma release.
          </p>
        </div>
        <Link className="button button-primary" href={`/packs/${heroId}`}>
          Enviar pack
        </Link>
      </div>

      <ol className="casting-flow">
        <li><span>01</span><strong>Gravação</strong><small>todas as falas com texto</small></li>
        <li><span>02</span><strong>Organização</strong><small>um WAV por ID da caption</small></li>
        <li><span>03</span><strong>Google Drive</strong><small>pasta compartilhada como leitor</small></li>
        <li><span>04</span><strong>Revisão</strong><small>direitos, formato e consistência</small></li>
      </ol>

      <div className="casting-empty">
        <div>
          <span className="status-pill open">ENVIO ABERTO</span>
          <h3>Um intérprete por pack</h3>
          <p>Cada envio permanece creditado ao seu autor. O projeto não combina falas de intérpretes diferentes dentro do mesmo pack.</p>
        </div>
        <div className="casting-reactions" aria-label="Critérios de revisão do pack">
          <span>✓ Captions completas</span>
          <span>✓ Arquivos nomeados</span>
          <span>✓ Voz autorizada</span>
          <span>✓ Formato técnico</span>
        </div>
      </div>
    </section>
  );
}
