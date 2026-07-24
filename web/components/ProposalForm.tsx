"use client";

import { FormEvent, useState } from "react";

export function ProposalForm({ lineId }: { lineId?: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/proposals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lineId: form.get("lineId"),
        kind: "translation",
        text: form.get("text"),
      }),
    });
    const payload = await response.json() as { error?: string };
    setMessage(response.ok ? "Proposta enviada para a triagem." : payload.error || "Não foi possível enviar.");
    setBusy(false);
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>ID da fala
        <input className="field" name="lineId" required defaultValue={lineId} placeholder="axe_move_01" />
      </label>
      <label>Texto proposto
        <textarea className="field" name="text" required minLength={2} maxLength={500} placeholder="Escreva uma fala natural em português brasileiro." />
      </label>
      <label><span><input type="checkbox" required /> Confirmo que este texto é meu e pode ser publicado sob CC BY 4.0.</span></label>
      <button className="button button-primary" disabled={busy}>{busy ? "Enviando…" : "Enviar para moderação"}</button>
      {message && <p className="notice" role="status">{message}</p>}
    </form>
  );
}
