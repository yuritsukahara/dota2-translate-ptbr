"use client";

import { useState } from "react";

const steps = [
  {
    number: "01",
    short: "Inventário",
    title: "O Dota local fornece o mapa de arquivos",
    description:
      "O sincronizador lê somente o índice do VPK instalado e encontra os caminhos técnicos de voz, como sounds/vo/axe/axe_move_01.vsnd_c. O inventário fica preso ao build do jogo para detectar mudanças após patches.",
    input: "dota/pak01_dir.vpk",
    output: "Catálogo base por herói",
    owner: "Ferramenta local",
  },
  {
    number: "02",
    short: "Legendas",
    title: "Cada slot é cruzado com captions oficiais",
    description:
      "Os tokens oficiais em inglês e PT-BR são associados aos assets pelo identificador. Somente linhas que possuírem caption oficial PT-BR podem entrar em uma futura dublagem.",
    input: "subtitles_axe_english.txt",
    output: "Catálogo oficial verificável",
    owner: "Fonte oficial local",
  },
  {
    number: "03",
    short: "Audição",
    title: "Cada candidato grava as mesmas cinco linhas",
    description:
      "A prévia padronizada permite comparar interpretação, dicção, presença e consistência. Todos os arquivos permanecem privados até a triagem de direitos e formato.",
    input: "5 captions oficiais PT-BR",
    output: "Prévia de interpretação",
    owner: "Candidato",
  },
  {
    number: "04",
    short: "Votação",
    title: "A comunidade escolhe a voz do herói",
    description:
      "Membros podem ouvir, comentar, curtir, desaprovar e votar. A decisão comunitária continua sujeita à revisão de direitos e qualidade técnica.",
    input: "Audições aprovadas na triagem",
    output: "Intérprete vencedor",
    owner: "Comunidade + revisores",
  },
  {
    number: "05",
    short: "Pack",
    title: "O vencedor assume o pack completo",
    description:
      "Depois da aprovação, somente a conta vencedora pode enviar as voicelines restantes. Um herói nunca mistura linhas gravadas por autores diferentes.",
    input: "Vencedor aprovado",
    output: "Pack exclusivo do intérprete",
    owner: "Intérprete selecionado",
  },
  {
    number: "06",
    short: "Compilação",
    title: "Os WAVs viram recursos Source 2",
    description:
      "Na máquina Windows do mantenedor, as ferramentas do jogo compilam cada gravação para .vsnd_c preservando exatamente o nome e o caminho do slot.",
    input: "WAVs revisados do pack",
    output: "Recursos .vsnd_c",
    owner: "Mantenedor",
  },
  {
    number: "07",
    short: "Pacote BR",
    title: "A camada brasileira recebe o pack",
    description:
      "O instalador cria um VPK brasileiro separado. O VPK base do Dota nunca é sobrescrito e o pacote guarda crédito e manifesto do intérprete vencedor.",
    input: "Recursos revisados",
    output: "dota_brazilian/pak01_*.vpk",
    owner: "Instalador reversível",
  },
  {
    number: "08",
    short: "Fallback",
    title: "O jogo escolhe PT-BR quando existe e original quando falta",
    description:
      "Com AudioLanguage brazilian, o motor procura primeiro no VPK comunitário. Se o caminho estiver ausente, continua a busca e usa o áudio original instalado.",
    input: "Pedido de uma voiceline",
    output: "PT-BR ou fallback original",
    owner: "Motor de áudio",
  },
] as const;

export function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = steps[activeIndex];

  return (
    <div className="explainer">
      <div className="explainer-steps" role="list" aria-label="Etapas do funcionamento">
        {steps.map((step, index) => (
          <div role="listitem" key={step.number}>
            <button
              type="button"
              className={`explainer-step${index === activeIndex ? " active" : ""}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <span>{step.number}</span>
              <strong>{step.short}</strong>
            </button>
          </div>
        ))}
      </div>

      <article className="explainer-stage" aria-live="polite">
        <div className="explainer-stage-copy">
          <p className="eyebrow">ETAPA {active.number} · {active.owner.toUpperCase()}</p>
          <h2>{active.title}</h2>
          <p>{active.description}</p>
        </div>
        <div className="explainer-transform" aria-label={`${active.input} se transforma em ${active.output}`}>
          <div>
            <span>ENTRADA</span>
            <code>{active.input}</code>
          </div>
          <span className="explainer-arrow" aria-hidden="true">→</span>
          <div>
            <span>RESULTADO</span>
            <strong>{active.output}</strong>
          </div>
        </div>
      </article>

      <div className="mount-diagram" aria-label="Prioridade de busca dos arquivos de áudio">
        <div className="mount-request">
          <span>PEDIDO DO JOGO</span>
          <code>sounds/vo/axe/axe_move_01.vsnd_c</code>
        </div>
        <div className="mount-line" aria-hidden="true" />
        <div className="mount-options">
          <article className="mount-option brazilian">
            <span className="mount-order">1º</span>
            <p>PROCURA PRIMEIRO</p>
            <h3>dota_brazilian/<br />pak01.vpk</h3>
            <strong>Encontrou? Toca PT-BR.</strong>
          </article>
          <article className="mount-option original">
            <span className="mount-order">2º</span>
            <p>FALLBACK AUTOMÁTICO</p>
            <h3>dota/<br />pak01.vpk</h3>
            <strong>Não encontrou? Toca o original.</strong>
          </article>
        </div>
      </div>
    </div>
  );
}
