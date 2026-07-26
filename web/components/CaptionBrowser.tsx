"use client";

import { useMemo, useState } from "react";
import type { OfficialVoiceLine } from "@/lib/catalog";
import { categoryLabel } from "@/lib/catalog";

export function CaptionBrowser({ lines }: { lines: OfficialVoiceLine[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(
    () => [...new Set(lines.map((line) => line.category))].sort(),
    [lines],
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return lines.filter((line) =>
      (category === "all" || line.category === category) &&
      (!normalized ||
        line.id.includes(normalized) ||
        line.captionEn.toLowerCase().includes(normalized) ||
        (line.captionPtBr || "").toLowerCase().includes(normalized)),
    );
  }, [category, lines, query]);

  return (
    <>
      <div className="toolbar">
        <input
          className="field search-field"
          aria-label="Buscar captions"
          placeholder="Buscar caption, ID ou palavra…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="field"
          aria-label="Filtrar captions por categoria"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          <option value="all">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item} value={item}>{categoryLabel(item)}</option>
          ))}
        </select>
      </div>
      <p className="form-note">{filtered.length} de {lines.length} captions visíveis</p>
      <div className="caption-table" role="table" aria-label="Captions oficiais">
        <div className="caption-table-head" role="row">
          <strong>ID e categoria</strong>
          <strong>Inglês oficial</strong>
          <strong>Português brasileiro oficial</strong>
        </div>
        {filtered.map((line) => (
          <article className="caption-row" role="row" key={line.id}>
            <div>
              <code>{line.id}</code>
              <small>{categoryLabel(line.category)}</small>
            </div>
            <p>{line.captionEn}</p>
            <p className={line.captionPtBr ? "caption-available" : "caption-missing"}>
              {line.captionPtBr || "Não publicada pela Valve neste build"}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
