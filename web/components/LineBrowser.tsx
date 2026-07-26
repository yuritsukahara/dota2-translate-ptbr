"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { OfficialVoiceLine } from "@/lib/catalog";
import { categoryLabel } from "@/lib/catalog";
import { OriginalAudio } from "@/components/OriginalAudio";
import type { CurrentTranslation } from "@/lib/current-translations";
import { findRelevantTerms, validateTerminology } from "@/lib/terminology";

function translationLabel(source: CurrentTranslation["source"]) {
  if (source === "official") return "caption oficial";
  if (source === "community") return "tradução da comunidade";
  return "tradução automática";
}

export function LineBrowser({
  heroId,
  lines,
  translations,
  responsePage,
}: {
  heroId: string;
  lines: OfficialVoiceLine[];
  translations: Record<string, CurrentTranslation>;
  responsePage: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [steamUser, setSteamUser] = useState<{ displayName: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedLine, setSelectedLine] = useState<OfficialVoiceLine | null>(null);
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
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
  const relevantTerms = selectedLine ? findRelevantTerms(selectedLine.captionEn) : [];
  const terminologyWarnings = selectedLine ? validateTerminology(selectedLine.captionEn, suggestion) : [];

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((payload: { user?: { displayName: string } | null }) => setSteamUser(payload.user || null))
      .finally(() => setAuthChecked(true));
  }, []);

  function openSuggestion(line: OfficialVoiceLine) {
    setSelectedLine(line);
    setSuggestion(translations[line.id]?.text || "");
    setMessage("");
  }

  async function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLine || terminologyWarnings.length) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/caption-suggestions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ heroId, lineId: selectedLine.id, text: suggestion }),
    });
    const payload = await response.json() as { error?: string };
    if (response.ok) {
      setMessage("Sugestão enviada para a comunidade.");
      setSuggestion("");
    } else {
      setMessage(payload.error || "Não foi possível enviar a sugestão.");
    }
    setBusy(false);
  }

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
            {authChecked && steamUser ? (
              <button className="caption-select" type="button" onClick={() => openSuggestion(line)}>
                Sugerir alteração
              </button>
            ) : authChecked ? (
              <a className="caption-select" href="/api/auth/steam/start">Entrar para sugerir</a>
            ) : (
              <span className="suggestion-auth-loading">Verificando Steam…</span>
            )}
          </article>
        ))}
      </div>
      {selectedLine && steamUser && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="suggestion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestion-modal-title"
          >
            <div className="suggestion-modal-head">
              <div>
                <p className="eyebrow">SUGESTÃO DA COMUNIDADE</p>
                <h2 id="suggestion-modal-title">Alterar {selectedLine.id}</h2>
              </div>
              <button type="button" className="modal-close" aria-label="Fechar" onClick={() => setSelectedLine(null)}>×</button>
            </div>
            <div className="translation-columns">
              <article><small>INGLÊS OFICIAL</small><p>{selectedLine.captionEn}</p></article>
              <article className="preview-card"><small>PT-BR ATUAL</small><p>{translations[selectedLine.id]?.text || "Sem versão PT-BR"}</p></article>
            </div>
            {relevantTerms.length > 0 && (
              <div className="terminology-guard">
                <strong>Nomes oficiais nesta fala</strong>
                <div>{relevantTerms.map((term) => <span key={term.key}>{term.en} → <b>{term.ptBr}</b></span>)}</div>
              </div>
            )}
            <form className="suggestion-form" onSubmit={submitSuggestion}>
              <label htmlFor="hero-caption-suggestion">Sua versão em português brasileiro</label>
              <textarea
                id="hero-caption-suggestion"
                className="field"
                minLength={2}
                maxLength={500}
                required
                value={suggestion}
                onChange={(event) => setSuggestion(event.target.value)}
              />
              {terminologyWarnings.map((warning) => (
                <p className="terminology-warning" key={warning.key}>
                  Use “{warning.expectedTerm}” para o {warning.type} “{warning.sourceTerm}”.
                </p>
              ))}
              <div className="suggestion-modal-actions">
                <small>Enviando como {steamUser.displayName}</small>
                <button className="button button-primary" disabled={busy || terminologyWarnings.length > 0}>
                  {busy ? "Enviando…" : "Enviar sugestão"}
                </button>
              </div>
              {message && <p className="notice" role="status">{message}</p>}
            </form>
          </section>
        </div>
      )}
    </>
  );
}
