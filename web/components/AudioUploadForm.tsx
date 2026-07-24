"use client";

import { FormEvent, useState } from "react";

export function AudioUploadForm({ lineId }: { lineId?: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const data = new FormData(event.currentTarget);
    data.set("consent", data.get("consent") ? "true" : "false");
    const response = await fetch("/api/uploads/audio", { method: "POST", body: data });
    const payload = await response.json() as { error?: string };
    setMessage(response.ok ? "Gravação enviada para a triagem privada." : payload.error || "Não foi possível enviar.");
    setBusy(false);
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>ID da fala
        <input className="field" name="lineId" required defaultValue={lineId} placeholder="axe_move_01" />
      </label>
      <label>Crédito do intérprete
        <input className="field" name="credit" required maxLength={100} placeholder="Nome ou pseudônimo" />
      </label>
      <label>WAV PCM mono, 16-bit, 24/48 kHz
        <input className="field" type="file" name="file" required accept=".wav,audio/wav" />
      </label>
      <label><span><input type="checkbox" name="consent" required /> Sou a pessoa gravada ou tenho autorização; concedo CC BY 4.0 e não imito uma pessoa sem consentimento.</span></label>
      <button className="button button-primary" disabled={busy}>{busy ? "Enviando…" : "Enviar gravação"}</button>
      {message && <p className="notice" role="status">{message}</p>}
    </form>
  );
}
