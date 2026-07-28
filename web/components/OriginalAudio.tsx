"use client";

import { useState } from "react";

export function OriginalAudio({
  sourceId,
  lineId,
}: {
  sourceId: string;
  lineId: string;
}) {
  const [unavailable, setUnavailable] = useState(false);
  const fileName = `${lineId}.mp3`;
  const localUrl = `/audio/${encodeURIComponent(sourceId)}/${encodeURIComponent(fileName)}`;

  return (
    <span className="original-audio-source">
      <strong>Som original</strong>
      {!unavailable ? (
        <audio
          controls
          preload="none"
          src={localUrl}
          aria-label={`Ouvir áudio original de ${lineId}`}
          onError={() => setUnavailable(true)}
        />
      ) : (
        <small>Arquivo não encontrado no catálogo de áudio.</small>
      )}
      <small>Arquivo extraído do Dota.</small>
    </span>
  );
}
