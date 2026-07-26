"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogLine } from "@/lib/catalog";
import { categoryLabel } from "@/lib/catalog";

export function LineBrowser({ lines }: { lines: CatalogLine[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => [...new Set(lines.map((line) => line.category))].sort(), [lines]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return lines.filter((line) =>
      (category === "all" || line.category === category) &&
      (!normalized ||
        line.id.includes(normalized) ||
        line.sourceText.toLowerCase().includes(normalized) ||
        line.ptBrText.toLowerCase().includes(normalized)),
    );
  }, [category, lines, query]);

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
          <Link className="line-row" href={`/linhas/${line.id}`} key={line.id}>
            <span className="line-id">{line.id}</span>
            <span className="line-category">{categoryLabel(line.category)}</span>
            <span className="line-copy">
              <strong>{line.sourceText || "Sem legenda oficial"}</strong>
              <small>{line.ptBrText}</small>
            </span>
            <span className={`status-pill ${line.translationStatus === "approved" ? "open" : ""}`}>
              {line.translationStatus === "approved" ? "aprovada" : line.ptBrText ? "rascunho PT-BR" : "aguardando"}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
