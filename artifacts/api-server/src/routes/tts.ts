import { Router } from "express";

const router = Router();

const CHARACTER_GENDER: Record<string, "female" | "male"> = {
  priya: "female", rohit: "male", maya: "female", arjun: "male",
  neha: "female", rahul: "male", ananya: "female", priya_coach: "female",
  raj: "male", vikram: "male", meera_coach: "female", kabir: "male",
  sanjay: "male", aryan: "male",
};

// Give existing Leadonto characters consistent, distinct Gemini studio voices.
// Unknown characters fall back to a voice selected by gender.
const CHARACTER_VOICE: Record<string, string> = {
  priya: "Kore",
  rohit: "Puck",
  maya: "Aoede",
  arjun: "Charon",
  neha: "Leda",
  rahul: "Orus",
  ananya: "Achird",
  priya_coach: "Sulafat",
  raj: "Fenrir",
  vikram: "Alnilam",
  meera_coach: "Despina",
  kabir: "Rasalgethi",
  sanjay: "Sadaltager",
  aryan: "Laomedeia",
};

const SUPPORTED_LANGUAGES = new Set([
  "English", "Hindi", "Bangla", "Bengali", "Gujarati", "Filipino", "Finnish",
  "Dutch", "Galician", "Georgian", "French", "Greek", "German", "Haitian Creole",
  "Indonesian", "Hebrew", "Italian", "Hungarian", "Japanese", "Icelandic", "Korean",
  "Javanese", "Marathi", "Kannada", "Polish", "Konkani", "Portuguese", "Lao",
  "Romanian", "Latin", "Russian", "Latvian", "Spanish", "Lithuanian", "Tamil",
  "Luxembourgish", "Telugu", "Macedonian", "Thai", "Malagasy", "Turkish", "Malay",
  "Ukrainian", "Vietnamese", "Afrikaans", "Mongolian", "Albanian", "Nepali",
  "Amharic", "Norwegian", "Armenian", "Azerbaijani", "Persian", "Punjabi",
  "Bulgarian", "Serbian", "Burmese", "Sinhala", "Catalan", "Swahili", "Croatian",
  "Slovak", "Czech", "Slovenian", "Danish", "Swedish", "Estonian", "Urdu",
]);

function cleanForTTS(text: string): string {
  return text
    .replace(/^[A-Za-zÀ-ÿ'\s]{2,30}:\s*/m, "")
    .replace(/\b(?:Ack|Next):\s*/gi, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\([^)]{1,30}\)/g, "")
    .replace(/\bBFSI\b/gi, "B F S I")
    .replace(/\bCEFR\b/gi, "C E F R")
    .replace(/\bRBI\b/gi, "R B I")
    .replace(/\bB2B\b/gi, "business to business")
    .replace(/\bUPI\b/gi, "U P I")
    .replace(/\bAPI\b/gi, "A P I")
    .replace(/\bSQL\b/gi, "S Q L")
    .replace(/\bKPI\b/gi, "K P I")
    .replace(/\bATS\b/gi, "A T S")
    .replace(/\bMBA\b/gi, "M B A")
    .replace(/\bHR\b/gi, "H R")
    .replace(/\bAI\b/gi, "A I")
    .replace(/(हाँ|हां)(?![,\u0964।!?])/gu, "$1,")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function styleForLanguage(language: string): string {
  if (language === "English") {
    return "Speak in a natural Indian English accent. Use clear pronunciation, a warm professional tone, steady conversational pacing, and natural pauses. Do not sound like a newsreader.";
  }
  if (language === "Hindi") {
    return "Speak in natural conversational Hindi with clear, standard Indian Hindi pronunciation, a warm professional tone, and natural pacing.";
  }
  return `Speak naturally in ${language}, using fluent native pronunciation, clear diction, a warm conversational tone, and natural pacing.`;
}

function extractAudioData(payload: any): string | null {
  const direct = payload?.output_audio?.data ?? payload?.outputAudio?.data;
  if (typeof direct === "string" && direct) return direct;

  // Raw Interactions REST responses carry inline audio in
  // steps[].content[].data. Accept the documented audio block and the
  // data-only variant returned by some API response envelopes.
  const steps = Array.isArray(payload?.steps) ? payload.steps : [];
  for (let i = steps.length - 1; i >= 0; i--) {
    const blocks = Array.isArray(steps[i]?.content) ? steps[i].content : [];
    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];
      const isAudio = block?.type === "audio"
        || String(block?.mime_type ?? block?.mimeType ?? "").startsWith("audio/");
      if (isAudio && typeof block?.data === "string" && block.data) {
        return block.data;
      }
    }
    // This endpoint is requested in audio-only mode, so a data-only final
    // content block is safe to treat as the requested audio if type metadata
    // was omitted by the response envelope.
    for (let j = blocks.length - 1; j >= 0; j--) {
      const block = blocks[j];
      if (typeof block?.data === "string" && block.data) return block.data;
    }
  }
  return null;
}

router.post("/tts", async (req, res) => {
  const { text, language = "English", voiceStyle, gender } = req.body as {
    text?: string;
    language?: string;
    voiceStyle?: string;
    gender?: "male" | "female";
  };

  if (typeof text !== "string" || !text.trim()) {
    res.status(400).json({ error: "Missing 'text' field" });
    return;
  }
  if (text.trim().length > 3000) {
    res.status(400).json({ error: "Text too long (max 3000 characters)" });
    return;
  }
  if (typeof language !== "string" || !SUPPORTED_LANGUAGES.has(language)) {
    res.status(400).json({
      error: "This Gemini TTS model does not list the requested language as supported.",
      supportedLanguages: Array.from(SUPPORTED_LANGUAGES),
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    req.log.error("GEMINI_API_KEY is not configured");
    res.status(503).json({ error: "Gemini TTS is not configured on the server." });
    return;
  }

  const cleaned = cleanForTTS(text.trim());
  if (!cleaned) {
    res.status(400).json({ error: "No speakable text" });
    return;
  }

  const character = (voiceStyle ?? "").toLowerCase();
  const requestedGender = gender === "male" || gender === "female"
    ? gender
    : (CHARACTER_GENDER[character] ?? "female");
  const voice = CHARACTER_VOICE[character] ?? (requestedGender === "male" ? "Puck" : "Kore");

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: "gemini-3.8-flash-tts",
        input: [{
          type: "user_input",
          content: [{
            type: "text",
            text: cleaned,
            annotations: [{
              type: "speech_metadata",
              style: styleForLanguage(language),
            }],
          }],
        }],
        response_format: {
          type: "audio",
          mime_type: "audio/wav",
          delivery: "inline",
          sample_rate: 24000,
        },
        generation_config: {
          speech_config: [{ voice }],
        },
      }),
      signal: AbortSignal.timeout(90000),
    });

    const payload = await response.json().catch(() => ({})) as any;
    if (!response.ok) {
      const providerMessage = typeof payload?.error?.message === "string"
        ? payload.error.message.slice(0, 1000)
        : "Gemini returned an unsuccessful response.";
      req.log.error({ status: response.status, providerMessage }, "Gemini TTS request failed");
      res.status(502).json({ error: "Gemini TTS generation failed", detail: providerMessage });
      return;
    }

    const audioBase64 = extractAudioData(payload);
    if (!audioBase64) {
      req.log.error({ responseKeys: Object.keys(payload ?? {}) }, "Gemini TTS returned no audio data");
      res.status(502).json({ error: "Gemini returned no audio data." });
      return;
    }

    const audio = Buffer.from(audioBase64, "base64");
    if (audio.length < 100 || audio.subarray(0, 4).toString("ascii") !== "RIFF") {
      req.log.error({ audioBytes: audio.length }, "Gemini TTS returned an invalid WAV payload");
      res.status(502).json({ error: "Gemini returned an invalid audio file." });
      return;
    }

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Length", audio.length);
    res.end(audio);
  } catch (err) {
    req.log.error({ err, language, voiceStyle }, "Gemini TTS request failed");
    if (!res.headersSent) {
      res.status(502).json({ error: "Gemini TTS service is unavailable." });
    }
  }
});

router.get("/tts/voices", (_req, res) => {
  res.json({
    provider: "google-gemini",
    model: "gemini-3.8-flash-tts",
    languages: Array.from(SUPPORTED_LANGUAGES),
    englishVoiceLanguageCode: "en-IN",
    englishVoices: { female: "Kore", male: "Puck" },
    characters: CHARACTER_VOICE,
    googleTtsRequired: true,
    edgeTtsRequired: false,
  });
});

export default router;
