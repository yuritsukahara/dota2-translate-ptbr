"use client";

import { Children, useMemo, useState } from "react";
import type { ReactNode } from "react";

export function HeroCatalog({
  entries,
  label = "heróis",
  children,
}: {
  entries: Array<{ id: string; name: string }>;
  label?: string;
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  const cards = Children.toArray(children);
  const visible = useMemo(
    () => entries
      .map((entry, index) => ({ entry, card: cards[index] }))
      .filter(({ entry }) => !normalized || entry.name.toLocaleLowerCase("pt-BR").includes(normalized)),
    [cards, entries, normalized],
  );

  return (
    <>
      <div className="hero-search">
        <input
          className="field search-field"
          type="search"
          aria-label={label === "heróis" ? "Buscar herói pelo nome" : `Buscar ${label} pelo nome`}
          placeholder={label === "heróis" ? "Buscar herói pelo nome…" : `Buscar ${label} pelo nome…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span>{visible.length} {label}</span>
      </div>
      <div className="hero-card-grid">
        {visible.map(({ entry, card }) => <div className="hero-card-slot" key={entry.id}>{card}</div>)}
      </div>
      {visible.length === 0 && <div className="empty-card">Nenhum herói encontrado para “{query}”.</div>}
    </>
  );
}
