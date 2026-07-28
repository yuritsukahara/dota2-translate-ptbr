import Link from "next/link";
import { Header } from "@/components/Header";
import { HeroCard } from "@/components/HeroCard";
import {
  CURRENT_BUILD,
  captionSources,
  getHeroLines,
  heroes,
  personas,
} from "@/lib/catalog";
import { getCurrentTranslations } from "@/lib/current-translations";
import { AnimatedCounter } from "@/components/AnimatedCounter";

export const metadata = {
  title: "Dublagem Brasileira Dota 2",
  description:
    "Portal comunitário para traduzir captions e reunir packs de voz de Dota 2 em português brasileiro.",
};

export default function Home() {
  const projectCaptionSources = [
    ...captionSources.map((source) => ({
      id: source.id,
      lines: getHeroLines(source.id),
    })),
    ...personas.map((persona) => ({
      id: persona.id,
      lines: persona.lines,
    })),
  ];
  const translatedTotal = projectCaptionSources.reduce(
    (sum, source) =>
      sum + Object.keys(getCurrentTranslations(source.id, source.lines)).length,
    0,
  );
  const catalogTotal = projectCaptionSources.reduce(
    (sum, source) => sum + source.lines.length,
    0,
  );
  const coverage = Math.floor((translatedTotal / catalogTotal) * 100);
  const featuredIds = ["crystal_maiden", "invoker", "juggernaut", "pudge"];
  const featuredHeroes = featuredIds
    .map((id) => heroes.find((hero) => hero.id === id))
    .filter((hero): hero is NonNullable<typeof hero> => Boolean(hero));
  return (
    <>
      <Header />
      <main>
        <section className="hero-shell">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">
                DUBLAGEM BRASILEIRA DOTA 2 · BUILD {CURRENT_BUILD}
              </p>
              <h1>
                Dublagem de Dota 2<span> </span>
                <span>Em português.</span>
              </h1>
              <p className="hero-lead">
                Um catálogo aberto para traduzir as vozes de todos os heróis e
                do narrador padrão, formar elencos brasileiros e levar essa
                demanda à Valve.
              </p>
              <div className="hero-actions">
                <Link className="button button-ghost" href="/heroes">
                  Explorar os 127 heróis
                </Link>
                <Link className="button button-ghost" href="/heroes">
                  Ver traduções
                </Link>
                <Link className="button button-primary" href="/peticao">
                  Assinar a petição
                </Link>
              </div>
              <dl className="hero-metrics">
                <div>
                  <dt>{heroes.length}</dt>
                  <dd>heróis</dd>
                </div>
                <div>
                  <dt>{personas.length}</dt>
                  <dd>personas e variantes</dd>
                </div>
                <div>
                  <dt>1</dt>
                  <dd>narrador padrão</dd>
                </div>
                <div>
                  <dt>{translatedTotal.toLocaleString("pt-BR")}</dt>
                  <dd>linhas PT-BR incluídas</dd>
                </div>
              </dl>
            </div>
            <div
              className="campaign-card"
              aria-label="Progresso geral das traduções"
            >
              <div className="campaign-mark" aria-hidden="true">
                PT-BR
              </div>
              <p className="card-kicker">COBERTURA GERAL</p>
              <h2>Linhas de Voz traduzidas</h2>
              <p>
                {translatedTotal.toLocaleString("pt-BR")} de{" "}
                {catalogTotal.toLocaleString("pt-BR")} captions já possuem uma
                versão brasileira incluída.
              </p>
              <div className="progress-row">
                <div className="progress-label">
                  <span>Catálogo PT-BR</span>
                  <span>{coverage}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${coverage}%` }}
                  />
                </div>
              </div>
              <ol className="campaign-casting-list">
                <li>
                  <span>01</span>Inglês oficial preservado
                </li>
                <li>
                  <span>02</span>PT-BR incluído conforme é gerado
                </li>
                <li>
                  <span>03</span>Alternativas abertas à comunidade
                </li>
              </ol>
              <Link className="text-link" href="/announcer">
                Ver o narrador padrão <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="section section-dark">
          <div className="section-heading">
            <div>
              <p className="eyebrow">UM PROJETO PARA O JOGO INTEIRO</p>
              <h2>Texto, voz e comunidade.</h2>
            </div>
            <p>
              As legendas foram traduzidas para o PT-BR. A tradução inicial
              entra no catálogo imediatamente e sugestões comunitárias podem
              aperfeiçoá-la.
            </p>
          </div>
          <div className="principle-grid">
            <article>
              <span>01</span>
              <h3>Catálogo</h3>
              <p className="principle-stat">
                <AnimatedCounter
                  className="principle-counter"
                  value={catalogTotal}
                />
                <span className="principle-counter-copy">
                  captions do jogo organizadas por herói, persona, narrador e
                  build.
                </span>
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Tradução</h3>
              <p>
                O Codex gera a base PT-BR e cada origem permanece claramente
                identificada.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Comunidade</h3>
              <p>
                Qualquer pessoa pode sugerir uma alternativa mais natural e
                contribuir usando sua identidade Steam.
              </p>
            </article>
            <article>
              <span>04</span>
              <h3>Vozes</h3>
              <p>
                Cada pack mantém um único intérprete para preservar a identidade
                do personagem.
              </p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">UM ELENCO PARA CADA HERÓI</p>
              <h2>Herois padrões</h2>
            </div>
            <Link className="text-link" href="/heroes">
              Ver todos <span>→</span>
            </Link>
          </div>
          <div className="hero-card-grid">
            {featuredHeroes.map((hero) => (
              <HeroCard key={hero.id} hero={hero} />
            ))}
          </div>
        </section>

        <section className="section section-personas">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">PERSONAS TAMBÉM TÊM VOZ PRÓPRIA</p>
              <h2>Personas</h2>
            </div>
            <Link className="text-link" href="/personas">
              Ver todas <span>→</span>
            </Link>
          </div>
          <div className="hero-card-grid">
            {personas
              .filter((item) => item.type === "persona")
              .slice(0, 4)
              .map((persona) => (
                <HeroCard key={persona.id} persona={persona} />
              ))}
          </div>
        </section>
      </main>
    </>
  );
}
