import { Router } from "express";

const router = Router();

type SupportedLanguage = "English" | "Hindi";
const CHARACTER_GENDER: Record<string, "female" | "male"> = {
  priya: "female", rohit: "male", maya: "female", arjun: "male",
  neha: "female", rahul: "male", ananya: "female", priya_coach: "female",
  raj: "male", vikram: "male", meera_coach: "female", kabir: "male",
  sanjay: "male", aryan: "male",
};

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return value === "English" || value === "Hindi";
}

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

router.post("/tts", async (req, res) => {
  const { text, language = "English", voiceStyle, gender } = req.body as {
    text?: string;
    language?: string;
    voiceStyle?: string;
    gender?: "male" | "female";
  };

  if (!text?.trim()) {
    res.status(400).json({ error: "Missing 'text' field" });
    return;
  }
  if (text.trim().length > 3000) {
    res.status(400).json({ error: "Text too long (max 3000 characters)" });
    return;
  }
  if (!isSupportedLanguage(language)) {
    res.status(400).json({
      error: "Kokoro Indian-accent TTS currently supports English and Hindi only.",
      supportedLanguages: ["English", "Hindi"],
    });
    return;
  }

  const cleaned = cleanForTTS(text.trim());
  if (!cleaned) {
    res.status(400).json({ error: "No speakable text" });
    return;
  }

  const character = (voiceStyle ?? "maya").toLowerCase();
  const requestedGender = gender ?? CHARACTER_GENDER[character] ?? "female";
  const voice = language === "Hindi"
    ? (requestedGender === "male" ? "hm_omega" : "hf_alpha")
    : (requestedGender === "male" ? "indian_male" : "indian_female");

  try {
    const response = await fetch("http://127.0.0.1:8001/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleaned, language, voice }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const detail = await response.text();
      req.log.error({ status: response.status, detail }, "Kokoro TTS service failed");
      res.status(502).json({ error: "Kokoro TTS generation failed" });
      return;
    }

    const audio = Buffer.from(await response.arrayBuffer());
    if (!audio.length) {
      res.status(502).json({ error: "Kokoro returned empty audio" });
      return;
    }
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Length", audio.length);
    res.end(audio);
  } catch (err) {
    req.log.error({ err, language, voiceStyle }, "Kokoro TTS request failed");
    if (!res.headersSent) res.status(502).json({ error: "Kokoro TTS service is unavailable" });
  }
});

router.get("/tts/voices", (_req, res) => {
  res.json({
    provider: "kokoro",
    model: "Kokoro-82M",
    languages: ["English", "Hindi"],
    englishVoiceLanguageCode: "en-IN",
    englishVoices: { female: "indian_female", male: "indian_male" },
    characters: Object.fromEntries(
      Object.entries(CHARACTER_GENDER).map(([character, gender]) => [
        character, gender === "male" ? "indian_male" : "indian_female",
      ]),
    ),
    googleTtsRequired: false,
    edgeTtsRequired: false,
  });
});

export default router;
