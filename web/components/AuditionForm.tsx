"use client";

import { FormEvent, useState } from "react";
import type { OfficialVoiceLine } from "@/lib/catalog";

export function AuditionForm({
  heroId,
  lines,
}: {
  heroId: string;
  lines: OfficialVoiceLine[];
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    data.set("heroId", heroId);
    data.set("lineIds", JSON.stringify(lines.map((line) => line.id)));
    data.set("consent", data.get("consent") ? "true" : "false");
    const response = await fetch("/api/auditions", { method: "POST", body: data });
    const payload = (await response.json()) as { error?: string };
    setMessage(
      response.ok
        ? "Audição enviada para a triagem privada."
        : payload.error || "Não foi possível enviar a audição."
    );
    setBusy(false);
  }

  return (
    <form className="form-stack audition-form" onSubmit={submit}>
      <label>
        Crédito público
        <input className="field" name="credit" required maxLength={100} placeholder="Nome ou pseudônimo" />
      </label>
      {lines.map((line, index) => (
        <label key={line.id}>
          <span>
            {index + 1}. {line.captionPtBr || "Caption oficial PT-BR indisponível"}{" "}
            <code>{line.id}</code>
          </span>
          <input className="field" type="file" name="clips" required accept=".wav,audio/wav" />
        </label>
      ))}
      <label>
        <span>
          <input type="checkbox" name="consent" required /> Sou a pessoa
          gravada, autorizo a publicação sob CC BY 4.0 e aceito produzir o pack
          completo se minha audição vencer.
        </span>
      </label>
      <button className="button button-primary" disabled={busy || lines.length !== 5}>
        {busy ? "Enviando…" : "Enviar audição de 5 linhas"}
      </button>
      {message && <p className="notice" role="status">{message}</p>}
    </form>
  );
}
