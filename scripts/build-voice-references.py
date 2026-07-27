#!/usr/bin/env python
"""Monta referências curtas para clonagem a partir do catálogo MP3 local."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf


ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = ROOT / "build" / "local-audio" / "catalog.json"
AUDIO_ROOT = ROOT / "build" / "local-audio"
OUTPUT_ROOT = ROOT / "build" / "voice-lab" / "references"
SAMPLE_RATE = 24_000


def trim_voice(audio: np.ndarray) -> np.ndarray:
    if not audio.size:
        return audio
    peak = float(np.max(np.abs(audio)))
    if peak <= 1e-6:
        return np.empty(0, dtype=np.float32)
    active = np.flatnonzero(np.abs(audio) >= peak * 0.012)
    if not active.size:
        return np.empty(0, dtype=np.float32)
    padding = int(SAMPLE_RATE * 0.04)
    start = max(0, int(active[0]) - padding)
    end = min(len(audio), int(active[-1]) + padding)
    return audio[start:end].astype(np.float32, copy=False)


def build_reference(hero_id: str, lines: list[dict], seconds: float) -> dict:
    spoken = [
        line
        for line in lines
        if line.get("heroId") == hero_id and line.get("captionEn")
    ]
    preferred = [line for line in spoken if len(line["captionEn"].split()) >= 3]
    candidates = sorted(
        preferred or spoken,
        key=lambda line: int(line.get("bytes", 0)),
        reverse=True,
    )
    segments: list[np.ndarray] = []
    selected: list[dict] = []
    current_samples = 0
    target_samples = int(seconds * SAMPLE_RATE)
    silence = np.zeros(int(0.14 * SAMPLE_RATE), dtype=np.float32)

    for line in candidates:
        source = AUDIO_ROOT / line["mp3"]
        if not source.exists():
            continue
        audio, _ = librosa.load(source, sr=SAMPLE_RATE, mono=True)
        audio = trim_voice(audio)
        if len(audio) < int(0.35 * SAMPLE_RATE):
            continue
        remaining = target_samples - current_samples
        if remaining <= 0:
            break
        audio = audio[:remaining]
        if segments:
            segments.append(silence)
        segments.append(audio)
        current_samples += len(audio) + (len(silence) if len(segments) > 1 else 0)
        selected.append(
            {
                "id": line["id"],
                "captionEn": line["captionEn"],
                "source": line["mp3"],
            }
        )

    if not selected:
        raise RuntimeError(f"Nenhuma fala utilizável encontrada para {hero_id}.")

    reference = np.concatenate(segments)
    reference = reference[:target_samples]
    peak = float(np.max(np.abs(reference)))
    if peak > 0:
        reference *= 0.70 / peak

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT_ROOT / f"{hero_id}.wav"
    sf.write(destination, reference, SAMPLE_RATE, subtype="PCM_16")
    return {
        "heroId": hero_id,
        "file": str(destination.relative_to(ROOT)).replace("\\", "/"),
        "seconds": round(len(reference) / SAMPLE_RATE, 3),
        "sampleRate": SAMPLE_RATE,
        "syntheticVoiceReference": True,
        "sources": selected,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", default="axe", help="ID do herói ou announcer")
    parser.add_argument("--all", action="store_true", help="Monta todas as referências disponíveis")
    parser.add_argument("--seconds", type=float, default=10.0)
    args = parser.parse_args()

    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    hero_ids = sorted({line["heroId"] for line in catalog["lines"]})
    selected_ids = hero_ids if args.all else [args.hero]
    manifests = []
    skipped = []
    for hero_id in selected_ids:
        try:
            manifests.append(build_reference(hero_id, catalog["lines"], args.seconds))
        except RuntimeError as error:
            skipped.append({"heroId": hero_id, "error": str(error)})

    manifest_path = OUTPUT_ROOT / "manifest.json"
    previous = {}
    if manifest_path.exists():
        previous = {
            item["heroId"]: item
            for item in json.loads(manifest_path.read_text(encoding="utf-8"))
        }
    previous.update({item["heroId"]: item for item in manifests})
    manifest_path.write_text(
        json.dumps(list(previous.values()), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    for item in manifests:
        print(f"{item['heroId']}: {item['seconds']} s · {len(item['sources'])} falas")
    for item in skipped:
        print(f"IGNORADO {item['heroId']}: {item['error']}")


if __name__ == "__main__":
    main()
