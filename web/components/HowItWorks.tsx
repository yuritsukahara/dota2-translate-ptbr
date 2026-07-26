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
    output: "285 slots base do Axe",
    owner: "Ferramenta local",
  },
  {
    number: "02",
    short: "Legendas",
    title: "Cada slot é cruzado com a legenda oficial",
    description:
      "Os tokens oficiais em inglês são associados aos assets pelo identificador. Só uma fala textual com legenda entra no lote de tradução; grunhidos, risadas e assets sem legenda permanecem como fallback original.",
    input: "subtitles_axe_english.txt",
    output: "243 falas traduzíveis",
    owner: "Fonte oficial local",
  },
  {
    number: "03",
    short: "Tradução",
    title: "A comunidade adapta texto e intenção",
    description:
      "Tradutores propõem versões PT-BR usando a legenda oficial como fonte. Votos ajudam a escolher, mas a proposta só avança depois de quórum, tempo mínimo e revisão linguística.",
    input: "Legenda + contexto",
    output: "Texto PT-BR aprovado",
    owner: "Comunidade",
  },
  {
    number: "04",
    short: "Gravação",
    title: "Uma interpretação licenciada ocupa o slot",
    description:
      "Um intérprete grava a linha aprovada em WAV mono. Consentimento, crédito e CC BY 4.0 são obrigatórios; áudio extraído do jogo e clonagem não autorizada são recusados.",
    input: "WAV PCM 16-bit",
    output: "Áudio revisado",
    owner: "Intérprete + revisores",
  },
  {
    number: "05",
    short: "Compilação",
    title: "Workshop Tools convertem WAV em recurso Source 2",
    description:
      "Na máquina Windows do mantenedor, as ferramentas oficiais compilam cada WAV para .vsnd_c. O nome e o caminho precisam ser idênticos ao slot original para a substituição funcionar.",
    input: "axe_move_01.wav",
    output: "axe_move_01.vsnd_c",
    owner: "Mantenedor",
  },
  {
    number: "06",
    short: "Pacote BR",
    title: "Os recursos entram em um VPK brasileiro separado",
    description:
      "O instalador cria dota_brazilian/pak01_dir.vpk e seu arquivo de dados. O pacote contém somente vozes comunitárias; o VPK base do Dota nunca é sobrescrito.",
    input: "243 recursos .vsnd_c",
    output: "dota_brazilian/pak01_*.vpk",
    owner: "Instalador reversível",
  },
  {
    number: "07",
    short: "Montagem",
    title: "Português-Brasil ativa a camada de idioma",
    description:
      "AudioLanguage brazilian faz o Source 2 procurar automaticamente game/dota_brazilian. O log confirma que o pacote brasileiro é montado antes do pacote base.",
    input: 'AudioLanguage "brazilian"',
    output: "Camada brasileira ativa",
    owner: "Source 2",
  },
  {
    number: "08",
    short: "Fallback",
    title: "O jogo escolhe PT-BR quando existe e original quando falta",
    description:
      "Ao pedir uma fala, o motor procura primeiro no VPK brasileiro. Se o mesmo caminho estiver presente, toca a gravação PT-BR; se estiver ausente, continua a busca e usa o áudio original do Dota.",
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
