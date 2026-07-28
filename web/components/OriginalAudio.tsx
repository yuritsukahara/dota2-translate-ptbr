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
  const [loading, setLoading] = useState(false);
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
          aria-busy={loading}
          onPlay={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onWaiting={() => setLoading(true)}
          onStalled={() => setLoading(true)}
          onSeeking={() => setLoading(true)}
          onSeeked={() => setLoading(false)}
          onPause={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setUnavailable(true);
          }}
        />
      ) : (
        <small>Arquivo não encontrado no catálogo de áudio.</small>
      )}
      <span className="audio-feedback" aria-live="polite">
        {loading ? (
          <small className="audio-loading-status">
            <span className="audio-loading-spinner" aria-hidden="true" />
            Carregando áudio…
          </small>
        ) : null}
      </span>
      <small>Arquivo extraído do Dota.</small>
    </span>
  );
}
