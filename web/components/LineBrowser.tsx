"use client";

import { useMemo, useState } from "react";
import type { OfficialVoiceLine } from "@/lib/catalog";
import { categoryLabel } from "@/lib/catalog";
import { OriginalAudio } from "@/components/OriginalAudio";
import type { CurrentTranslation } from "@/lib/current-translations";

function translationLabel(source: CurrentTranslation["source"]) {
  if (source === "official") return "caption oficial";
  if (source === "community") return "tradução da comunidade";
  return "tradução automática";
}

export function LineBrowser({
  lines,
  translations,
  responsePage,
}: {
  lines: OfficialVoiceLine[];
  translations: Record<string, CurrentTranslation>;
  responsePage: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(lines.map((line) => line.category))].sort(), [lines]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return lines.filter((line) =>
      (category === "all" || line.category === category) &&
      (!normalized ||
        line.id.includes(normalized) ||
        line.captionEn.toLowerCase().includes(normalized) ||
        (translations[line.id]?.text || "").toLowerCase().includes(normalized)),
    );
  }, [category, lines, query, translations]);

  return (
    <>
      <div className="toolbar">
        <input className="field search-field" aria-label="Buscar falas" placeholder="Buscar por ID ou contexto…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="field" aria-label="Filtrar por categoria" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">Todas as categorias</option>
          {categories.map((item) => <option key={item} value={item}>{categoryLabel(item)}</option>)}
        </select>
      </div>
      <p className="form-note">{filtered.length} de {lines.length} falas visíveis</p>
      <div className="line-list">
        {filtered.map((line) => (
          <article className="line-row official-line-row" key={line.id}>
            <span className="line-id">{line.id}</span>
            <OriginalAudio lineId={line.id} responsePage={responsePage} />
            <span className="line-copy">
              <small>EN · caption oficial</small>
              <strong>{line.captionEn}</strong>
            </span>
            <span className="line-copy">
              <small>
                PT-BR · {translations[line.id]
                  ? translationLabel(translations[line.id].source)
                  : "sem tradução"}
              </small>
              <strong>{translations[line.id]?.text || "Sem versão PT-BR no catálogo"}</strong>
            </span>
            <span className={`status-pill ${translations[line.id] ? "open" : ""}`}>
              {translations[line.id] ? "incluída" : "pendente"}
            </span>
          </article>
        ))}
      </div>
    </>
  );
}
