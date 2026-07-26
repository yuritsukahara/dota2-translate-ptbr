"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { OfficialVoiceLine } from "@/lib/catalog";
import { categoryLabel } from "@/lib/catalog";
import { findRelevantTerms, validateTerminology } from "@/lib/terminology";

type Suggestion = {
  id: string;
  text: string;
  status: string;
  author: string;
  authorAvatar: string | null;
  createdAt: string;
  support: number;
  oppose: number;
};

export function CaptionBrowser({
  heroId,
  lines,
  previews,
  automaticTranslations,
}: {
  heroId: string;
  lines: OfficialVoiceLine[];
  previews: Record<string, string>;
  automaticTranslations: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const categories = useMemo(
    () => [...new Set(lines.map((line) => line.category))].sort(),
    [lines],
  );
  const selected = lines.find((line) => line.id === selectedId);
  const relevantTerms = selected ? findRelevantTerms(selected.captionEn) : [];
  const localWarnings = selected ? validateTerminology(selected.captionEn, suggestion) : [];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return lines.filter((line) =>
      (category === "all" || line.category === category) &&
      (!normalized ||
        line.id.includes(normalized) ||
        line.captionEn.toLowerCase().includes(normalized) ||
        (line.captionPtBr || "").toLowerCase().includes(normalized) ||
        (previews[line.id] || "").toLowerCase().includes(normalized) ||
        (automaticTranslations[line.id] || "").toLowerCase().includes(normalized)),
    );
  }, [automaticTranslations, category, lines, previews, query]);

  async function loadSuggestions(lineId: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/caption-suggestions?line=${encodeURIComponent(lineId)}`);
      const payload = await response.json() as { suggestions?: Suggestion[] };
      setSuggestions(payload.suggestions || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedId) void loadSuggestions(selectedId);
  }, [selectedId]);

  async function submitSuggestion(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setMessage("");
    if (localWarnings.length) {
      setMessage("Corrija os nomes oficiais destacados antes de enviar.");
      return;
    }
    const response = await fetch("/api/caption-suggestions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ heroId, lineId: selected.id, text: suggestion }),
    });
    const payload = await response.json() as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Não foi possível enviar.");
      return;
    }
    setSuggestion("");
    setMessage("Sugestão publicada para votação.");
    await loadSuggestions(selected.id);
  }

  async function vote(id: string, kind: "support" | "oppose") {
    const response = await fetch(`/api/caption-suggestions/${id}/vote`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    const payload = await response.json() as { error?: string };
    if (!response.ok) {
      setMessage(payload.error || "Não foi possível votar.");
      return;
    }
    if (selected) await loadSuggestions(selected.id);
  }

  return (
    <>
      <div className="toolbar">
        <input
          className="field search-field"
          aria-label="Buscar captions"
          placeholder="Buscar caption, ID, tradução ou palavra…"
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
      <div className="caption-table" role="table" aria-label="Captions e prévias comunitárias">
        <div className="caption-table-head" role="row">
          <strong>ID e categoria</strong>
          <strong>Inglês oficial</strong>
          <strong>Português brasileiro</strong>
          <strong>Ação</strong>
        </div>
        {filtered.map((line) => {
          const isOpen = selectedId === line.id;
          const currentTranslation =
            line.captionPtBr || previews[line.id] || automaticTranslations[line.id] || "";
          return (
            <article className={`caption-row-shell ${isOpen ? "selected" : ""}`} key={line.id}>
              <div className="caption-row" role="row">
                <div>
                  <code>{line.id}</code>
                  <small>{categoryLabel(line.category)}</small>
                </div>
                <p>{line.captionEn}</p>
                <p className={currentTranslation ? "caption-available" : "caption-missing"}>
                  {currentTranslation || "Prévia ainda não criada"}
                  {line.captionPtBr && <small className="inline-source-label">OFICIAL PT-BR</small>}
                  {!line.captionPtBr && previews[line.id] && (
                    <small className="inline-source-label">COMUNITÁRIA</small>
                  )}
                  {!line.captionPtBr && !previews[line.id] && automaticTranslations[line.id] && (
                    <small className="inline-source-label automatic">AUTOMÁTICA · NÃO REVISADA</small>
                  )}
                </p>
                <button
                  className="caption-select"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`editor-${line.id}`}
                  onClick={() => {
                    setSelectedId(isOpen ? "" : line.id);
                    setSuggestion(isOpen ? "" : currentTranslation);
                    setSuggestions([]);
                    setMessage("");
                  }}
                >
                  {isOpen ? "Fechar" : "Sugerir"}
                </button>
              </div>

              {isOpen && (
                <section className="caption-inline-editor" id={`editor-${line.id}`} aria-label={`Editar ${line.id}`}>
                  {relevantTerms.length > 0 && (
                    <div className="terminology-guard">
                      <strong>Nomes oficiais nesta fala</strong>
                      <div>
                        {relevantTerms.map((term) => (
                          <span key={term.key}>
                            {term.en} → <b>{term.ptBr}</b>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="inline-editor-grid">
                    <form className="suggestion-form" onSubmit={submitSuggestion}>
                      <div className="inline-editor-heading">
                        <label htmlFor={`caption-suggestion-${line.id}`}>Sugerir tradução PT-BR</label>
                        <small>{suggestion.length}/500</small>
                      </div>
                      <textarea
                        id={`caption-suggestion-${line.id}`}
                        className="field"
                        maxLength={500}
                        minLength={2}
                        required
                        value={suggestion}
                        onChange={(event) => setSuggestion(event.target.value)}
                        placeholder={currentTranslation || "Escreva uma versão natural em português brasileiro…"}
                      />
                      {localWarnings.map((warning) => (
                        <p className="terminology-warning" key={warning.key}>
                          Use “{warning.expectedTerm}” para o {warning.type} “{warning.sourceTerm}”.
                        </p>
                      ))}
                      <div className="inline-submit-row">
                        <small>A sugestão ficará aberta para votos da comunidade.</small>
                        <button className="button button-primary" type="submit">Publicar sugestão</button>
                      </div>
                      {message && (
                        <p className="form-message" role="status">
                          {message}{" "}
                          {message.includes("Steam") && <a href="/api/auth/steam/start">Entrar com Steam →</a>}
                        </p>
                      )}
                    </form>

                    <div className="community-suggestions">
                      <div className="suggestion-heading">
                        <strong>Sugestões e votos</strong>
                        <span>{suggestions.length}</span>
                      </div>
                      {loading && <p className="form-note">Carregando sugestões…</p>}
                      {!loading && suggestions.length === 0 && (
                        <p className="inline-empty">Nenhuma sugestão ainda. Você pode abrir a votação.</p>
                      )}
                      {suggestions.map((item) => (
                        <article className="caption-suggestion" key={item.id}>
                          <p>{item.text}</p>
                          <div>
                            <span>por {item.author}</span>
                            <div>
                              <button type="button" onClick={() => vote(item.id, "support")} aria-label="Apoiar sugestão">
                                ▲ {item.support}
                              </button>
                              <button type="button" onClick={() => vote(item.id, "oppose")} aria-label="Desaprovar sugestão">
                                ▼ {item.oppose}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
