"use client";

import { useState } from "react";

const steps = [
  {
    number: "01",
    short: "Inventário",
    title: "O Dota local fornece o mapa de arquivos",
    description:
      "O sincronizador lê o índice do VPK instalado, identifica cada voz e fixa o catálogo ao build do jogo. Assim, patches podem ser comparados sem misturar heróis-base, personas e variantes.",
    input: "VPK instalado",
    output: "Catálogo por build",
    owner: "Ferramenta local",
  },
  {
    number: "02",
    short: "Captions",
    title: "Cada voz é ligada à caption oficial",
    description:
      "Os identificadores dos sons são cruzados com os arquivos oficiais de legenda em inglês e português brasileiro. A fonte original permanece visível em cada linha.",
    input: "subtitles_*_english.txt",
    output: "Caption ligada ao áudio",
    owner: "Catálogo oficial",
  },
  {
    number: "03",
    short: "PT-BR",
    title: "O catálogo recebe uma versão brasileira",
    description:
      "A prioridade é caption oficial, tradução comunitária e versão sugerida. Usuários Steam podem enviar uma alternativa mais natural sem bloquear a cobertura existente.",
    input: "Caption em inglês",
    output: "Versão PT-BR identificada",
    owner: "Texto + comunidade",
  },
  {
    number: "04",
    short: "Referência",
    title: "O som original continua somente na máquina local",
    description:
      "O player usa o MP3 extraído da instalação local para comparar intenção, ritmo e contexto. O repositório e o servidor público não precisam armazenar o áudio original.",
    input: "Arquivo local do Dota",
    output: "Referência no player",
    owner: "Ambiente local",
  },
  {
    number: "05",
    short: "Kit",
    title: "Cada herói oferece uma estrutura pronta",
    description:
      "O portal gera um ZIP com README, checklist e pasta de WAVs. Gemidos e sons sem texto ficam fora da lista obrigatória.",
    input: "Catálogo do herói",
    output: "Kit de gravação ZIP",
    owner: "Portal",
  },
  {
    number: "06",
    short: "Pack",
    title: "Um intérprete grava o personagem completo",
    description:
      "A pessoa organiza um WAV por ID, mantém uma única identidade vocal e compartilha a pasta completa pelo Google Drive.",
    input: "WAVs nomeados",
    output: "Pasta completa no Drive",
    owner: "Intérprete",
  },
  {
    number: "07",
    short: "Steam",
    title: "A Steam identifica cada contribuição",
    description:
      "O login Steam é exigido para sugerir captions, enviar packs e assinar a petição. Consulta do catálogo, áudio local e kits de gravação continuam públicos.",
    input: "Steam OpenID",
    output: "Contribuição creditada",
    owner: "Comunidade",
  },
] as const;

export function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = steps[activeIndex];

  return (
    <div className="explainer">
      <div
        className="explainer-steps"
        role="list"
        aria-label="Etapas do funcionamento"
      >
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
          <p className="eyebrow">
            ETAPA {active.number} · {active.owner.toUpperCase()}
          </p>
          <h2>{active.title}</h2>
          <p>{active.description}</p>
        </div>
        <div
          className="explainer-transform"
          aria-label={`${active.input} se transforma em ${active.output}`}
        >
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
    </div>
  );
}
