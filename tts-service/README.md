# Leadonto TTS providers

The API server now tries providers in this order when `TTS_PROVIDER=auto`:

1. **Gemini 2.5 Flash Preview TTS** — uses `GEMINI_API_KEY` from Google AI Studio. Keep the Google AI Studio project on its Free billing tier; the endpoint does not enable Google Cloud Billing. Google quotas and model availability still apply.
2. **Microsoft Edge TTS** — no API key or cloud billing. The main API Docker image installs `edge-tts`; it uses Microsoft's online speech service, so it is not offline and availability is not guaranteed by an SLA.
3. **Kokoro-82M** — optional self-hosted service in this folder. It supports English and Hindi in this implementation.

## Main API Railway variables

- `TTS_PROVIDER=auto` (default): try Gemini, then Edge, then Kokoro.
- `TTS_PROVIDER=gemini`, `edge`, or `kokoro`: force one provider for diagnosis.
- `GEMINI_API_KEY`: optional Google AI Studio API key. No Google Cloud billing key is needed for the AI Studio free tier.
- `KOKORO_TTS_URL`: optional base URL of the separately deployed Kokoro service, with no trailing slash.

Deploying the main API with the repository's root `Dockerfile` installs Edge TTS automatically. If Gemini has no key, is rate-limited, or fails, the API attempts Edge TTS. Kokoro is attempted only if its URL is configured.

## Deploy Kokoro as a separate Railway service

Create a second Railway service from this same repository. Set its root directory to the repository root and its Dockerfile path to `tts-service/Dockerfile`. Railway supplies the `PORT` variable; the included command listens on port 8000, so set the service's start command to:

```sh
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

If Railway's Dockerfile build uses the root context, the supplied Dockerfile copies `tts-service/requirements.txt` and `tts-service/main.py`. Set the main API service's `KOKORO_TTS_URL` to the Kokoro service's private or public base URL. Kokoro downloads model weights on first use and needs substantially more RAM/CPU than Edge TTS; it is optional, not a free unlimited hosted service.

## Run Kokoro locally

From the repository root:

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r tts-service/requirements.txt
uvicorn main:app --app-dir tts-service --host 127.0.0.1 --port 8000
```

On Windows PowerShell, activate with `.venv\\Scripts\\Activate.ps1`. Point the API server's `KOKORO_TTS_URL` to `http://127.0.0.1:8000` when both processes run on the same machine.

## API checks

- `GET /api/tts/voices` reports provider configuration and fallback order.
- `POST /api/tts` accepts the existing Leadonto request body: `text`, `language`, `gender`, and optional `voiceStyle`.
- Successful responses are WAV for Gemini/Kokoro and MP3 for Edge. The existing frontend plays audio blobs by MIME type, so no UI contract change is required.
