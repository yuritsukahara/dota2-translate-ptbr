import { useParams } from "@/src/compat/navigation";
import Image from "@/src/compat/image";
import Link from "@/src/compat/link";
import { VoicePackForm } from "@/components/VoicePackForm";
import { getHero, getVoicePackSource } from "@/lib/catalog";

export default function VoicePackPage() {
  const { hero: heroId = "" } = useParams<{ hero: string }>();
  const source = getVoicePackSource(heroId);
  if (!source) return null;
  const isBaseHero = Boolean(getHero(heroId));
  const catalogHref = isBaseHero
    ? `/heroes/${source.id}`
    : `/personas/${source.id}`;
  const typeLabel = isBaseHero
    ? "HERÓI BASE"
    : "type" in source && source.type === "persona"
      ? "PERSONA"
      : "VARIANTE DE VOZ";

  return (
    <>
      <main className="page-shell">
        <div className="hero-detail-head pack-submit-head">
          <Image
            src={source.imageUrl}
            alt={`Retrato de ${source.name}`}
            width={616}
            height={346}
            unoptimized={source.imageUrl.startsWith("/")}
          />
          <div>
            <p className="eyebrow">PACK DE VOZ · {typeLabel} · {source.name.toUpperCase()}</p>
            <h1 className="page-title">Envie sua interpretação completa</h1>
            <p>
              Grave todas as captions faladas de {source.name}, organize os WAVs
              em uma pasta do Google Drive e envie o link pelo portal.
              Um pack sempre preserva a voz de um único intérprete.
            </p>
            <Link className="text-link" href={catalogHref}>Consultar todas as captions <span>→</span></Link>
          </div>
        </div>

        <div className="pack-submit-layout">
          <section className="form-card">
            <p className="eyebrow">LINK DA PASTA</p>
            <h2>Enviar pack de {source.name}</h2>
            <VoicePackForm heroId={source.id} heroName={source.name} />
          </section>
          <aside className="pack-guidelines">
            <p className="eyebrow">DIRETRIZES OBRIGATÓRIAS</p>
            <h2>Antes de enviar</h2>
            <div className="pack-kit-download">
              <div>
                <strong>Comece pela pasta preparada</strong>
                <p>
                  Baixe o ZIP de {source.name} com a pasta <code>wav/</code>,
                  README e checklist de todas as captions faladas.
                </p>
              </div>
              <a
                className="button button-primary"
                href={`/api/voice-pack-template/${source.id}`}
                download
              >
                Baixar pasta preparada
              </a>
            </div>
            <ol>
              <li><span>01</span><div><strong>Pack completo</strong><p>Inclua todas as falas com texto. Gemidos e sons sem palavras são opcionais.</p></div></li>
              <li><span>02</span><div><strong>Nomes exatos</strong><p>Use o ID da caption como arquivo: <code>nome_da_linha.wav</code>.</p></div></li>
              <li><span>03</span><div><strong>Formato técnico</strong><p>WAV PCM mono, 16-bit, 24 ou 48 kHz, sem música, efeitos ou redução agressiva de ruído.</p></div></li>
              <li><span>04</span><div><strong>Pasta acessível</strong><p>Google Drive em modo “Qualquer pessoa com o link — Leitor”. Não envie arquivos soltos.</p></div></li>
              <li><span>05</span><div><strong>Voz autorizada</strong><p>Somente sua própria voz ou uma interpretação com autorização. Nada de áudio do jogo ou clonagem não autorizada.</p></div></li>
              <li><span>06</span><div><strong>Uma identidade</strong><p>Não misture intérpretes dentro do mesmo pack. Variações devem ficar em subpastas identificadas.</p></div></li>
            </ol>
          </aside>
        </div>
      </main>
    </>
  );
}
