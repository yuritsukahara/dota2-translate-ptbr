"use client";

import { useState } from "react";
export function PetitionButton({
  alreadySigned,
  language,
  onSigned,
}: {
  alreadySigned: boolean;
  language: "pt-BR" | "en";
  onSigned?: () => void;
}) {
  const [signedLocally, setSignedLocally] = useState(false);
  const [status, setStatus] = useState<"" | "error">("");
  const english = language === "en";
  const signed = alreadySigned || signedLocally;

  async function sign() {
    setStatus("");
    const response = await fetch("/api/petition/sign", { method: "POST" });
    if (response.status === 401) {
      window.location.href = "/api/auth/steam/start?returnTo=%2Fpeticao";
      return;
    }
    if (!response.ok) {
      setStatus("error");
      return;
    }
    setSignedLocally(true);
    onSigned?.();
  }

  if (signed) {
    return (
      <div className="petition-action petition-thanks" role="status">
        <span aria-hidden="true">✓</span>
        <div>
          <strong>
            {english ? "Thank you for signing!" : "Obrigado por assinar!"}
          </strong>
          <p>
            {english
              ? "Your support helps Brazilian voices reach Dota 2."
              : "Seu apoio ajuda as vozes brasileiras a chegarem ao Dota 2."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="petition-action">
      <button className="button button-primary" type="button" onClick={sign}>
        {english ? "Sign the letter with Steam" : "Assinar a carta com Steam"}
      </button>
      <p className="form-note" aria-live="polite">
        {status === "error"
          ? (english ? "We could not record your signature." : "Não foi possível registrar a assinatura.")
          : (english ? "One signature per Steam ID." : "Uma assinatura por Steam ID.")}
      </p>
    </div>
  );
}
