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
}: {
  heroId: string;
  lines: OfficialVoiceLine[];
  previews: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState(lines[0]?.id || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const categories = useMemo(
    () => [...new Set(lines.map((line) => line.category))].sort(),
    [lines],
  );
  const selected = lines.find((line) => line.id === selectedId) || lines[0];
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
        (previews[line.id] || "").toLowerCase().includes(normalized)),
    );
  }, [category, lines, previews, query]);

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
      {selected && (
        <section className="translation-workspace" aria-labelledby="translation-title">
          <div className="translation-workspace-head">
            <div>
              <p className="eyebrow">LINHA SELECIONADA · {categoryLabel(selected.category)}</p>
              <h2 id="translation-title">{selected.id}</h2>
            </div>
            <span className="community-badge">PT-BR comunitário · não oficial</span>
          </div>

          <div className="translation-columns">
            <article>
              <small>CAPTION OFICIAL EM INGLÊS</small>
              <p>{selected.captionEn}</p>
            </article>
            <article className="preview-card">
              <small>PRÉVIA COMUNITÁRIA PT-BR</small>
              <p>{previews[selected.id] || "Ainda não há prévia para esta linha."}</p>
            </article>
          </div>

          {relevantTerms.length > 0 && (
            <div className="terminology-guard">
              <strong>Nomes oficiais detectados</strong>
              <div>
                {relevantTerms.map((term) => (
                  <span key={term.key}>
                    {term.type}: {term.en} → <b>{term.ptBr}</b>
                  </span>
                ))}
              </div>
              <small>Esses nomes devem ser preservados exatamente nas sugestões.</small>
            </div>
          )}

          <div className="suggestion-layout">
            <form className="suggestion-form" onSubmit={submitSuggestion}>
              <label htmlFor="caption-suggestion">Sua sugestão para esta caption</label>
              <textarea
                id="caption-suggestion"
                className="field"
                maxLength={500}
                minLength={2}
                required
                value={suggestion}
                onChange={(event) => setSuggestion(event.target.value)}
                placeholder="Escreva uma versão natural em português brasileiro…"
              />
              <div className="suggestion-form-foot">
                <small>{suggestion.length}/500</small>
                <button className="button button-primary" type="submit">Enviar sugestão</button>
              </div>
              {localWarnings.map((warning) => (
                <p className="terminology-warning" key={warning.key}>
                  Use “{warning.expectedTerm}” para o {warning.type} “{warning.sourceTerm}”.
                </p>
              ))}
              {message && (
                <p className="form-message">
                  {message}{" "}
                  {message.includes("Steam") && <a href="/api/auth/steam/start">Entrar com Steam →</a>}
                </p>
              )}
            </form>

            <div className="community-suggestions">
              <div className="suggestion-heading">
                <strong>Sugestões da comunidade</strong>
                <span>{suggestions.length}</span>
              </div>
              {loading && <p className="form-note">Carregando sugestões…</p>}
              {!loading && suggestions.length === 0 && (
                <p className="form-note">Seja a primeira pessoa a sugerir uma versão para esta linha.</p>
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
          <strong>Prévia comunitária PT-BR</strong>
          <strong>Ação</strong>
        </div>
        {filtered.map((line) => (
          <article className={`caption-row ${selected.id === line.id ? "selected" : ""}`} role="row" key={line.id}>
            <div>
              <code>{line.id}</code>
              <small>{categoryLabel(line.category)}</small>
            </div>
            <p>{line.captionEn}</p>
            <p className={previews[line.id] ? "caption-available" : "caption-missing"}>
              {previews[line.id] || "Prévia ainda não criada"}
            </p>
            <button className="caption-select" type="button" onClick={() => {
              setSelectedId(line.id);
              setMessage("");
              document.getElementById("translation-title")?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}>
              {selected.id === line.id ? "Editando" : "Sugerir"}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
