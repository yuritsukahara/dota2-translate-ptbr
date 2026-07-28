"use client";

import { FormEvent, useState } from "react";

export function VoicePackForm({ heroId, heroName }: { heroId: string; heroName: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/voice-packs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        heroId,
        credit: form.get("credit"),
        driveFolderUrl: form.get("driveFolderUrl"),
        notes: form.get("notes"),
        ownsVoice: form.get("ownsVoice") === "on",
        acceptsLicense: form.get("acceptsLicense") === "on",
        followedGuidelines: form.get("followedGuidelines") === "on",
      }),
    });
    if (response.status === 401) {
      window.location.href = `/api/auth/steam/start?returnTo=${encodeURIComponent(`/packs/${heroId}`)}`;
      return;
    }
    const payload = await response.json() as { error?: string };
    if (response.ok) {
      event.currentTarget.reset();
      setSuccess(true);
      setMessage(`Pack de ${heroName} enviado com sucesso.`);
    } else {
      setSuccess(false);
      setMessage(payload.error || "Não foi possível enviar o pack.");
    }
    setBusy(false);
  }

  return (
    <form className="form-stack voice-pack-form" onSubmit={submit}>
      <label>
        Crédito público
        <input className="field" name="credit" required minLength={2} maxLength={100} placeholder="Nome artístico ou pseudônimo" />
      </label>
      <label>
        Pasta do Google Drive
        <input
          className="field"
          name="driveFolderUrl"
          type="url"
          required
          inputMode="url"
          placeholder="https://drive.google.com/drive/folders/..."
        />
        <small>Compartilhe a pasta como “Qualquer pessoa com o link — Leitor”.</small>
      </label>
      <label>
        Observações sobre o pack
        <textarea className="field" name="notes" maxLength={1000} placeholder="Direção de voz, equipamento usado ou informações importantes…" />
      </label>
      <label className="check-row">
        <input type="checkbox" name="ownsVoice" required />
        <span>Sou a pessoa gravada ou tenho autorização documentada de quem interpreta o pack.</span>
      </label>
      <label className="check-row">
        <input type="checkbox" name="acceptsLicense" required />
        <span>Autorizo a publicação das gravações sob CC BY 4.0 com o crédito informado.</span>
      </label>
      <label className="check-row">
        <input type="checkbox" name="followedGuidelines" required />
        <span>Organizei todos os arquivos conforme as diretrizes desta página.</span>
      </label>
      <button className="button button-primary" disabled={busy}>
        {busy ? "Enviando…" : "Enviar pack de voz"}
      </button>
      {message && <p className={success ? "notice success" : "notice"} role="status">{message}</p>}
    </form>
  );
}
