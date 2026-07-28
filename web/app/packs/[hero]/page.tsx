import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { VoicePackForm } from "@/components/VoicePackForm";
import { getHero, heroes } from "@/lib/catalog";

export function generateStaticParams() {
  return heroes.map((hero) => ({ hero: hero.id }));
}

export default async function VoicePackPage({
  params,
}: {
  params: Promise<{ hero: string }>;
}) {
  const { hero: heroId } = await params;
  const hero = getHero(heroId);
  if (!hero) notFound();

  return (
    <>
      <Header />
      <main className="page-shell">
        <div className="hero-detail-head pack-submit-head">
          <Image src={hero.imageUrl} alt={`Retrato de ${hero.name}`} width={616} height={346} />
          <div>
            <p className="eyebrow">PACK DE VOZ · {hero.name.toUpperCase()}</p>
            <h1 className="page-title">Envie sua interpretação completa</h1>
            <p>
              Grave todas as captions faladas de {hero.name}, organize os WAVs
              em uma pasta do Google Drive e envie o link pelo portal.
              Um pack sempre preserva a voz de um único intérprete.
            </p>
            <Link className="text-link" href={`/heroes/${hero.id}`}>Consultar todas as captions <span>→</span></Link>
          </div>
        </div>

        <div className="pack-submit-layout">
          <section className="form-card">
            <p className="eyebrow">LINK DA PASTA</p>
            <h2>Enviar pack de {hero.name}</h2>
            <VoicePackForm heroId={hero.id} heroName={hero.name} />
          </section>
          <aside className="pack-guidelines">
            <p className="eyebrow">DIRETRIZES OBRIGATÓRIAS</p>
            <h2>Antes de enviar</h2>
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
