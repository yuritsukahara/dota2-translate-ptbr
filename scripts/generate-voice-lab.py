#!/usr/bin/env python
"""Gera um lote PT-BR sintético com o Chatterbox PT-BR V3 local."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import soundfile as sf
import torch


ROOT = Path(__file__).resolve().parents[1]
COMFY_ROOT = Path.home() / "AppData/Roaming/StabilityMatrix/Packages/ComfyUI"
SUITE_ROOT = COMFY_ROOT / "custom_nodes/TTS-Audio-Suite"
MODEL_ROOT = COMFY_ROOT / "models/TTS/chatterbox_official_23lang/PT-BR V3"
REFERENCE_ROOT = ROOT / "build/voice-lab/references"
OUTPUT_ROOT = ROOT / "build/voice-lab/generated"

sys.path.insert(0, str(COMFY_ROOT))
sys.path.insert(0, str(SUITE_ROOT))

from engines.chatterbox_official_23lang.tts import (  # noqa: E402
    ChatterboxOfficial23LangTTS,
)


def translations_for(hero_id: str) -> dict[str, tuple[str, str]]:
    resolved: dict[str, tuple[str, str]] = {}
    voice_catalog = json.loads(
        (ROOT / "web/data/voice-lines.json").read_text(encoding="utf-8")
    )
    for line in voice_catalog["heroes"].get(hero_id, []):
        if line.get("captionPtBr"):
            resolved[line["id"]] = (line["captionPtBr"], "oficial")

    if hero_id == "axe":
        axe_lines = json.loads((ROOT / "web/data/axe-lines.json").read_text(encoding="utf-8"))
        for line in axe_lines:
            if line.get("ptBrText"):
                resolved.setdefault(line["id"], (line["ptBrText"], "prévia comunitária"))

    automatic = json.loads(
        (ROOT / "web/data/automatic-translations.json").read_text(encoding="utf-8")
    )
    for line_id, text in automatic["translations"].get(hero_id, {}).items():
        if text:
            resolved.setdefault(line_id, (text, "automática não revisada"))
    return resolved


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", default="axe")
    parser.add_argument(
        "--all",
        action="store_true",
        help="Processa todos os perfis com referência e caption PT-BR.",
    )
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument(
        "--force",
        action="store_true",
        help="Gera novamente WAVs que já existem.",
    )
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--exaggeration", type=float, default=0.70)
    parser.add_argument("--cfg-weight", type=float, default=0.30)
    parser.add_argument("--temperature", type=float, default=0.75)
    parser.add_argument("--max-new-tokens", type=int, default=160)
    args = parser.parse_args()

    if not MODEL_ROOT.exists():
        raise FileNotFoundError(f"Modelo PT-BR ausente: {MODEL_ROOT}")

    if args.limit < 0:
        raise ValueError("--limit deve ser zero (todas) ou um número positivo.")

    if args.all:
        reference_manifest = json.loads(
            (REFERENCE_ROOT / "manifest.json").read_text(encoding="utf-8")
        )
        hero_ids = [item["heroId"] for item in reference_manifest]
    else:
        hero_ids = [args.hero]

    torch.manual_seed(args.seed)
    model = ChatterboxOfficial23LangTTS.from_local(
        MODEL_ROOT,
        "cuda",
        "local:PT-BR V3",
        "v3",
    )
    model.enable_watermarking = True

    generated_total = 0
    for hero_id in hero_ids:
        reference = REFERENCE_ROOT / f"{hero_id}.wav"
        translations = translations_for(hero_id)
        if not reference.exists() or not translations:
            print(f"IGNORADO {hero_id}: sem referência ou caption PT-BR.")
            continue

        hero_output = OUTPUT_ROOT / hero_id
        hero_output.mkdir(parents=True, exist_ok=True)
        manifest_path = hero_output / "manifest.json"
        manifest_by_id = {}
        if manifest_path.exists():
            manifest_by_id = {
                item["id"]: item
                for item in json.loads(manifest_path.read_text(encoding="utf-8"))
            }

        selected = list(translations.items())
        if args.limit:
            selected = selected[: args.limit]
        for index, (line_id, (text, source)) in enumerate(selected):
            destination = hero_output / f"{line_id}.wav"
            if destination.exists() and not args.force:
                print(f"JÁ EXISTE {hero_id}/{line_id}")
                continue
            print(f"[{index + 1}/{len(selected)}] {hero_id}/{line_id}: {text}")
            waveform = model.generate(
                text,
                language_id="pt",
                audio_prompt_path=str(reference),
                exaggeration=args.exaggeration,
                cfg_weight=args.cfg_weight,
                temperature=args.temperature,
                max_new_tokens=args.max_new_tokens,
            )
            sf.write(
                destination,
                waveform.squeeze(0).cpu().numpy(),
                model.sr,
                subtype="PCM_16",
            )
            manifest_by_id[line_id] = {
                "id": line_id,
                "textPtBr": text,
                "captionSource": source,
                "file": str(destination.relative_to(ROOT)).replace("\\", "/"),
                "model": "ResembleAI/Chatterbox-Multilingual-pt-br",
                "modelVersion": "V3",
                "voiceReference": str(reference.relative_to(ROOT)).replace("\\", "/"),
                "synthetic": True,
                "watermarked": True,
                "seed": args.seed,
            }
            # Checkpoint after every line so a long batch can be resumed safely.
            manifest_path.write_text(
                json.dumps(
                    list(manifest_by_id.values()),
                    ensure_ascii=False,
                    indent=2,
                ),
                encoding="utf-8",
            )
            generated_total += 1

    print(f"Gerados nesta execução: {generated_total} · {OUTPUT_ROOT}")


if __name__ == "__main__":
    main()
