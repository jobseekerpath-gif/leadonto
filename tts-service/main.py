from __future__ import annotations

from io import BytesIO
from threading import Lock

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

app = FastAPI(title="Leadonto Kokoro TTS", docs_url=None, redoc_url=None)
_pipelines = {}
_lock = Lock()
SAMPLE_RATE = 24000


class SynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=3000)
    language: str = "English"
    voice: str = "indian_female"


def get_pipeline(code: str):
    if code not in _pipelines:
        with _lock:
            if code not in _pipelines:
                from kokoro import KPipeline
                _pipelines[code] = KPipeline(lang_code=code)
    return _pipelines[code]


def get_voice(pipeline, voice: str, language: str):
    if language == "Hindi":
        return voice if voice in {"hf_alpha", "hm_omega"} else "hf_alpha"

    # Kokoro has no native Indian-English preset. Blend its Hindi and English
    # voice embeddings, then use the English phoneme pipeline so English text
    # is pronounced as English rather than passed through Hindi G2P.
    import torch
    hindi_voice = "hm_omega" if voice == "indian_male" else "hf_alpha"
    english_voice = "am_adam" if voice == "indian_male" else "af_heart"
    hindi_style = pipeline.load_voice(hindi_voice)
    english_style = pipeline.load_voice(english_voice)
    if hindi_style.shape != english_style.shape:
        raise RuntimeError("Kokoro voice embeddings cannot be blended")
    return torch.lerp(english_style, hindi_style, 0.70)


@app.get("/health")
def health():
    return {"status": "ok", "provider": "kokoro", "model": "Kokoro-82M"}


@app.post("/synthesize")
def synthesize(payload: SynthesisRequest):
    if payload.language not in {"English", "Hindi"}:
        raise HTTPException(status_code=400, detail="Only English and Hindi are supported")
    try:
        code = "h" if payload.language == "Hindi" else "a"
        pipeline = get_pipeline(code)
        voice = get_voice(pipeline, payload.voice, payload.language)
        chunks = []
        for _, _, audio in pipeline(payload.text, voice=voice):
            if audio is not None:
                if hasattr(audio, "detach"):
                    audio = audio.detach().cpu().numpy()
                chunks.append(np.asarray(audio, dtype=np.float32).reshape(-1))
        if not chunks:
            raise RuntimeError("Kokoro generated no audio")
        waveform = np.concatenate(chunks)
        output = BytesIO()
        sf.write(output, waveform, SAMPLE_RATE, format="WAV", subtype="PCM_16")
        return Response(content=output.getvalue(), media_type="audio/wav")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Kokoro synthesis failed: {exc}") from exc
