"use client";

import { useState } from "react";

export function OriginalAudio({
  lineId,
  responsePage,
}: {
  lineId: string;
  responsePage: string;
}) {
  const [unavailable, setUnavailable] = useState(false);
  const fileName = `${lineId}.mp3`;
  const audioUrl = `https://dota2.fandom.com/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}`;

  return (
    <span className="original-audio-source">
      <strong>Som original</strong>
      {!unavailable ? (
        <audio
          controls
          preload="none"
          src={audioUrl}
          aria-label={`Ouvir áudio original de ${lineId} no Fandom`}
          onError={() => setUnavailable(true)}
        />
      ) : (
        <small>Arquivo individual não encontrado no Fandom.</small>
      )}
      <a href={responsePage} target="_blank" rel="noreferrer">
        Fonte: Dota 2 Wiki/Fandom ↗
      </a>
    </span>
  );
}
