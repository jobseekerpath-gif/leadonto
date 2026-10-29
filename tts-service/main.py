from __future__ import annotations

from io import BytesIO
from threading import Lock

import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

app = FastAPI(title="Leadonto Kokoro Indian-accent TTS", docs_url=None, redoc_url=None)
_pipeline = None
_model_lock = Lock()
SAMPLE_RATE = 24000


class SynthesisRequest(BaseModel):
    text: str = Field(min_length=1, max_length=3000)
    language: str = "English"
    voice: str = "hf_alpha"


def get_pipeline():
    global _pipeline
    if _pipeline is None:
        with _model_lock:
            if _pipeline is None:
                # Kokoro Hindi voice pipeline is used for both Hindi and English
                # to retain the Indian-accented voice. There is deliberately no
                # alternate TTS provider or fallback engine.
                from kokoro import KPipeline
                _pipeline = KPipeline(lang_code="h")
    return _pipeline


@app.get("/health")
def health():
    return {"status": "ok", "provider": "kokoro", "model": "Kokoro-82M"}


@app.post("/synthesize")
def synthesize(payload: SynthesisRequest):
    if payload.language not in {"English", "Hindi"}:
        raise HTTPException(status_code=400, detail="Kokoro route supports English and Hindi only")
    if payload.voice not in {"hf_alpha", "hm_omega"}:
        raise HTTPException(status_code=400, detail="Unsupported Kokoro Indian-accent voice")

    try:
        pipeline = get_pipeline()
        chunks = []
        for _, _, audio in pipeline(payload.text, voice=payload.voice):
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
