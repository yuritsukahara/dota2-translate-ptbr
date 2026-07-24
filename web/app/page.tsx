import Link from "next/link";
import { Header } from "@/components/Header";
import { ProgressRail } from "@/components/ProgressRail";
import { HeroCard } from "@/components/HeroCard";
import { heroes, percent } from "@/lib/catalog";

export const metadata = {
  title: "Dota 2 Translate PT-BR — Cada herói. Cada fala.",
  description: "Portal comunitário para traduzir, gravar, revisar e instalar todas as vozes base do Dota 2 em português brasileiro.",
};

export default function Home() {
  const axe = heroes[0];
  return (
    <>
      <Header />
      <main>
        <section className="hero-shell">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">PROJETO COMUNITÁRIO · BUILD 2026-07-23</p>
              <h1>Cada herói.<br /><span>Cada fala.</span></h1>
              <p className="hero-lead">
                Uma dublagem brasileira construída em público — com inventário verificável,
                votação da comunidade, revisão humana e instalação reversível.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/heroes/axe">Explorar as 285 falas</Link>
                <Link className="button button-ghost" href="/enviar">Enviar uma proposta</Link>
              </div>
              <dl className="hero-metrics">
                <div><dt>285</dt><dd>slots mapeados</dd></div>
                <div><dt>100%</dt><dd>cobertura técnica</dd></div>
                <div><dt>0</dt><dd>áudios da Valve hospedados</dd></div>
              </dl>
            </div>
            <div className="campaign-card" aria-label="Progresso da campanha do Axe">
              <div className="campaign-mark" aria-hidden="true">AXE</div>
              <p className="card-kicker">CAMPANHA ATIVA</p>
              <h2>Axe abre o caminho</h2>
              <p>O inventário está completo. Agora a comunidade decide como ele vai soar em português.</p>
              <ProgressRail label="Tradução aprovada" value={percent(axe.translated, axe.total)} tone="gold" />
              <ProgressRail label="Áudio gravado" value={percent(axe.recorded, axe.total)} tone="rust" />
              <ProgressRail label="Revisado e lançado" value={percent(axe.reviewed, axe.total)} tone="red" />
              <Link className="text-link" href="/heroes/axe">Ver campanha <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="section section-dark">
          <div className="section-heading">
            <div>
              <p className="eyebrow">COBERTURA HONESTA</p>
              <h2>100% tem um significado.</h2>
            </div>
            <p>Um herói só fica completo quando cada slot base possui tradução, gravação e duas revisões independentes.</p>
          </div>
          <div className="principle-grid">
            <article><span>01</span><h3>Inventário</h3><p>Os nomes técnicos vêm do VPK instalado e ficam fixados a uma versão do jogo.</p></article>
            <article><span>02</span><h3>Comunidade</h3><p>Propostas abertas, apoio múltiplo e histórico público — sem esconder alternativas.</p></article>
            <article><span>03</span><h3>Curadoria</h3><p>Quórum, revisão linguística e revisão técnica antes de qualquer release.</p></article>
            <article><span>04</span><h3>Instalação</h3><p>Pacotes verificados, backup automático e restauração sem tocar em executáveis.</p></article>
          </div>
        </section>

        <section className="section">
          <div className="section-heading compact">
            <div><p className="eyebrow">HERÓIS</p><h2>Campanhas da comunidade</h2></div>
            <Link className="text-link" href="/heroes">Ver todos <span>→</span></Link>
          </div>
          <div className="hero-card-grid">
            {heroes.map((hero) => <HeroCard key={hero.id} hero={hero} />)}
          </div>
        </section>

        <section className="section release-banner">
          <div>
            <p className="eyebrow">RELEASE v0.1.0</p>
            <h2>O laboratório já funciona.</h2>
            <p>O pacote do Axe contém 285 vozes-guia geradas pelo projeto e um addon compilável com as ferramentas oficiais.</p>
          </div>
          <Link className="button button-primary" href="/releases">Baixar e instalar</Link>
        </section>
      </main>
      <footer className="footer">
        <p>Dota 2 Translate PT-BR · Projeto comunitário não afiliado à Valve.</p>
        <div><Link href="/creditos">Créditos</Link><a href="https://github.com/yuritsukahara/dota2-translate-ptbr">GitHub</a></div>
      </footer>
    </>
  );
}
