"use client";

import { useState } from "react";

export function PetitionButton({ alreadySigned }: { alreadySigned: boolean }) {
  const [signed, setSigned] = useState(alreadySigned);
  const [message, setMessage] = useState("");

  async function sign() {
    setMessage("");
    const response = await fetch("/api/petition/sign", { method: "POST" });
    if (response.status === 401) {
      window.location.href = "/api/auth/steam/start";
      return;
    }
    const body = await response.json() as { error?: string };
    if (!response.ok) {
      setMessage(body.error || "Não foi possível registrar a assinatura.");
      return;
    }
    setSigned(true);
    setMessage("Sua assinatura foi registrada. Obrigado por fortalecer esta voz.");
  }

  return (
    <div className="petition-action">
      <button className="button button-primary" type="button" onClick={sign} disabled={signed}>
        {signed ? "Petição assinada" : "Assinar a carta com Steam"}
      </button>
      <p className="form-note" aria-live="polite">
        {message || "Uma assinatura por Steam ID. Você escolhe se seu nome público aparece na lista."}
      </p>
    </div>
  );
}
