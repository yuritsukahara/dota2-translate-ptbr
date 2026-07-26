import Link from "next/link";
import { Header } from "@/components/Header";
import { HeroCard } from "@/components/HeroCard";
import { CURRENT_BUILD, heroes } from "@/lib/catalog";
import { getCommunityPreviews } from "@/lib/community-preview";

export const metadata = {
  title: "Dota 2 Translate PT-BR — Cada herói. Cada fala.",
  description: "Portal comunitário para traduzir, gravar, revisar e instalar todas as vozes base do Dota 2 em português brasileiro.",
};

export default function Home() {
  const axe = heroes.find((hero) => hero.id === "axe")!;
  const axePreviewCount = Object.keys(getCommunityPreviews("axe")).length;
  const featuredHeroes = [
    axe,
    ...heroes.filter((hero) => hero.id !== "axe").slice(0, 3),
  ];
  return (
    <>
      <Header />
      <main>
        <section className="hero-shell">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">PROJETO COMUNITÁRIO · BUILD {CURRENT_BUILD}</p>
              <h1>Cada herói.<br /><span>Cada fala.</span></h1>
              <p className="hero-lead">
                Traduza as captions oficiais em inglês, compare uma prévia PT-BR e
                ajude a comunidade a escolher a versão que melhor preserva cada herói.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/captions?heroi=axe">Traduzir captions do Axe</Link>
                <Link className="button button-ghost" href="/captions?heroi=announcer">Narrador padrão</Link>
                <Link className="button button-ghost" href="/heroes">Explorar todos os heróis</Link>
              </div>
              <dl className="hero-metrics">
                <div><dt>{heroes.length}</dt><dd>heróis catalogados</dd></div>
                <div><dt>{heroes.reduce((sum, hero) => sum + hero.total, 0).toLocaleString("pt-BR")}</dt><dd>captions oficiais EN</dd></div>
                <div><dt>0</dt><dd>áudios da Valve hospedados</dd></div>
              </dl>
            </div>
            <div className="campaign-card" aria-label="Progresso da campanha do Axe">
              <div className="campaign-mark" aria-hidden="true">AXE</div>
              <p className="card-kicker">PRIMEIRA TRADUÇÃO</p>
              <h2>Captions do Axe</h2>
              <p>O catálogo encontrou {axe.total} voicelines com caption oficial EN. Já há {axePreviewCount} prévias comunitárias PT-BR para revisar.</p>
              <ol className="campaign-casting-list">
                <li><span>01</span>Comparar inglês e prévia PT-BR</li>
                <li><span>02</span>Sugerir uma versão mais natural</li>
                <li><span>03</span>Apoiar ou desaprovar propostas</li>
              </ol>
              <Link className="text-link" href="/captions?heroi=axe">Abrir tradução <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="section section-dark">
          <div className="section-heading">
            <div>
              <p className="eyebrow">COBERTURA HONESTA</p>
              <h2>100% tem um significado.</h2>
            </div>
            <p>O inglês oficial permanece imutável. A tradução comunitária é rastreável, votada e revisada antes de orientar qualquer gravação.</p>
          </div>
          <div className="principle-grid">
            <article><span>01</span><h3>Inventário</h3><p>Os nomes técnicos vêm do VPK instalado e ficam fixados a uma versão do jogo.</p></article>
            <article><span>02</span><h3>Audição</h3><p>Cada candidato envia as mesmas cinco linhas para comparação justa.</p></article>
            <article><span>03</span><h3>Elenco</h3><p>Votos, comentários e revisão escolhem um intérprete único por herói.</p></article>
            <article><span>04</span><h3>Pack</h3><p>O vencedor grava todas as linhas elegíveis e recebe crédito no release.</p></article>
          </div>
        </section>

        <section className="section">
          <div className="section-heading compact">
            <div><p className="eyebrow">HERÓIS</p><h2>Elencos da comunidade</h2></div>
            <Link className="text-link" href="/heroes">Ver todos <span>→</span></Link>
          </div>
          <div className="hero-card-grid">
            {featuredHeroes.map((hero) => <HeroCard key={hero.id} hero={hero} />)}
          </div>
        </section>

        <section className="section release-banner">
          <div>
            <p className="eyebrow">RELEASE v0.1.0</p>
            <h2>O laboratório já funciona.</h2>
            <p>A camada brasileira já foi validada tecnicamente. Agora o portal aguarda captions oficiais PT-BR e o primeiro intérprete eleito.</p>
          </div>
          <Link className="button button-primary" href="/releases">Baixar e instalar</Link>
        </section>
      </main>
    </>
  );
}
