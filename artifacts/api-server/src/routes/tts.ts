import { Router, type Response } from "express";
import { EdgeTTS } from "node-edge-tts";

const router = Router();

type SupportedLanguage =
  | "English" | "Hindi" | "Tamil" | "Telugu" | "Bengali" | "Marathi"
  | "Gujarati" | "Kannada" | "Malayalam" | "Punjabi" | "Odia"
  | "Assamese" | "Urdu";

type EdgeVoice = { lang: string; female: string; male: string };

// Microsoft Edge online neural voices. No Google credentials or Kokoro API
// keys are used. English teachers specifically use Indian English (en-IN).
const EDGE_VOICES: Record<SupportedLanguage, EdgeVoice> = {
  English:  { lang: "en-IN", female: "en-IN-NeerjaNeural", male: "en-IN-PrabhatNeural" },
  Hindi:    { lang: "hi-IN", female: "hi-IN-SwaraNeural", male: "hi-IN-MadhurNeural" },
  Tamil:    { lang: "ta-IN", female: "ta-IN-PallaviNeural", male: "ta-IN-ValluvarNeural" },
  Telugu:   { lang: "te-IN", female: "te-IN-ShrutiNeural", male: "te-IN-MohanNeural" },
  Bengali:  { lang: "bn-IN", female: "bn-IN-TanishaaNeural", male: "bn-IN-BashkarNeural" },
  Marathi:  { lang: "mr-IN", female: "mr-IN-AarohiNeural", male: "mr-IN-ManoharNeural" },
  Gujarati: { lang: "gu-IN", female: "gu-IN-DhwaniNeural", male: "gu-IN-NiranjanNeural" },
  Kannada:  { lang: "kn-IN", female: "kn-IN-SapnaNeural", male: "kn-IN-GaganNeural" },
  Malayalam:{ lang: "ml-IN", female: "ml-IN-SobhanaNeural", male: "ml-IN-MidhunNeural" },
  Punjabi:  { lang: "pa-IN", female: "pa-IN-VaaniNeural", male: "pa-IN-OjasNeural" },
  // Use Hindi neural voices where a reliable dedicated catalog is not available.
  Odia:     { lang: "hi-IN", female: "hi-IN-SwaraNeural", male: "hi-IN-MadhurNeural" },
  Assamese: { lang: "hi-IN", female: "hi-IN-SwaraNeural", male: "hi-IN-MadhurNeural" },
  Urdu:     { lang: "ur-PK", female: "ur-PK-UzmaNeural", male: "ur-PK-AsadNeural" },
};

const CHARACTER_GENDER: Record<string, "female" | "male"> = {
  priya: "female", rohit: "male", maya: "female", arjun: "male",
  neha: "female", rahul: "male", ananya: "female", priya_coach: "female",
  raj: "male", vikram: "male", meera_coach: "female", kabir: "male",
  sanjay: "male", aryan: "male",
};

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return Object.prototype.hasOwnProperty.call(EDGE_VOICES, value);
}

function cleanForTTS(text: string): string {
  return text
    .replace(/^[A-Za-zÀ-ÿ'\s]{2,30}:\s*/m, "")
    .replace(/\b(?:Ack|Next):\s*/gi, "")
    .replace(/\*[^*]{1,40}\*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\([^)]{1,30}\)/g, "")
    .replace(/^\s*["'"]/m, "")
    .replace(/["'"]\s*$/m, "")
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
    // Give the Hindi affirmative a clean word boundary. Without punctuation
    // before the following word, some voices blur हाँ into “हान”.
    .replace(/(हाँ|हां)(?![,\u0964।!?])/gu, "$1,")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return value in LANGUAGE_CODES;
}

type VoiceSelection = { languageCode: string; name: string };
const KOKORO_CHARACTER_VOICES: Record<string,string> = { priya:"af_heart", rohit:"am_michael", maya:"af_bella", arjun:"am_adam", neha:"af_nicole", rahul:"am_fenrir", ananya:"af_sarah", priya_coach:"af_sky", raj:"am_onyx", vikram:"am_puck", meera_coach:"af_nova", kabir:"am_echo", sanjay:"am_liam", aryan:"am_eric" };
const nativeVoiceCache = new Map<string, VoiceSelection>();

function getKokoroConfig(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env.KOKORO_TTS_BASE_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.KOKORO_API_KEY?.trim();
  return baseUrl && apiKey ? { baseUrl, apiKey } : null;
}

async function chooseVoice(
  language: SupportedLanguage,
  voiceStyle?: string,
  gender?: "male" | "female",
): Promise<VoiceSelection> {
  // English teachers must use Google's en-IN voices. Kokoro's configured
  // voices are US-English and do not provide an Indian-English accent.
  const requestedCode = LANGUAGE_CODES[language];
  const cacheKey = `${requestedCode}:${gender ?? "any"}:${voiceStyle ?? "default"}`;
  const cached = nativeVoiceCache.get(cacheKey);
  if (cached) return cached;

  const client = getGoogleTtsClient();
  const [catalog] = await client.listVoices({ languageCode: requestedCode });
  const catalogVoices = (catalog.voices ?? [])
    .filter((voice) => voice.name && voice.languageCodes?.includes(requestedCode))
    .sort((a, b) => {
      const quality = (name: string) =>
        name.includes("Chirp3-HD") ? 0 :
        name.includes("Wavenet") ? 1 :
        name.includes("Neural2") ? 2 : 3;
      return quality(a.name ?? "") - quality(b.name ?? "") ||
        (a.name ?? "").localeCompare(b.name ?? "");
    });

  const requestedGender =
    gender === "female" ? "FEMALE" :
    gender === "male" ? "MALE" : undefined;
  const genderMatched = requestedGender
    ? catalogVoices.filter((voice) => String(voice.ssmlGender ?? "") === requestedGender)
    : catalogVoices;
  const available = genderMatched.length > 0 ? genderMatched : catalogVoices;

  // Odia and Assamese may not have dedicated catalog entries; use Hindi only
  // when Google returns no voices for the requested language.
  const fallbackCode = available.length > 0 ? requestedCode : "hi-IN";
  const fallbackCatalog = available.length > 0
    ? available
    : ((await client.listVoices({ languageCode: fallbackCode }))[0]?.voices ?? [])
      .filter((voice) => voice.name && voice.languageCodes?.includes(fallbackCode))
      .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  if (fallbackCatalog.length === 0 || !fallbackCatalog[0]?.name) {
    throw new Error(`No Google Cloud TTS voice is available for ${language}`);
  }

  const index = CHARACTER_ORDER.indexOf(
    (voiceStyle ?? "maya") as (typeof CHARACTER_ORDER)[number],
  );
  const selected = fallbackCatalog[Math.max(0, index) % fallbackCatalog.length]!;
  const selection = { languageCode: fallbackCode, name: selected.name! };
  nativeVoiceCache.set(cacheKey, selection);
  return selection;
}

async function synthesize(
  res: Response,
  text: string,
  language: SupportedLanguage,
  voiceName: string,
  voiceLanguageCode: string,
): Promise<void> {
  const tts = new EdgeTTS({
    voice: voiceName,
    lang: voiceLanguageCode,
    outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    rate: "-4%",
    timeout: 20000,
  });
  const chunks: Buffer[] = [];
  for await (const chunk of tts.streamAudio(text)) {
    if (Buffer.isBuffer(chunk)) chunks.push(chunk);
  }
  const audio = Buffer.concat(chunks);
  if (!audio.length) throw new Error(`Edge TTS returned no audio for ${voiceName}`);
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Length", audio.length);
  res.end(audio);
}

router.post("/tts", async (req, res) => {
  const {
    text,
    language = "English",
    voiceStyle,
    gender,
  } = req.body as {
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
  const targetLanguage = isSupportedLanguage(language) ? language : "English";
  const cleaned = cleanForTTS(text.trim());
  if (!cleaned) {
    res.status(400).json({ error: "No speakable text" });
    return;
  }

  try {
    const character = (voiceStyle ?? "maya").toLowerCase();
    const profile = EDGE_VOICES[targetLanguage];
    const requestedGender = gender ?? CHARACTER_GENDER[character] ?? "female";
    const voiceName = profile[requestedGender];
    await synthesize(res, cleaned, targetLanguage, voiceName, profile.lang);
  } catch (err) {
    req.log.error({ err, language: targetLanguage, voiceStyle }, "Google Cloud TTS failed");
    if (!res.headersSent) res.status(500).json({ error: "Google Cloud TTS failed" });
    else res.end();
  }
});

router.get("/tts/voices", (_req, res) => {
  res.json({
    provider: "microsoft-edge-tts",
    languages: Object.keys(EDGE_VOICES),
    englishVoiceLanguageCode: "en-IN",
    englishVoices: {
      female: EDGE_VOICES.English.female,
      male: EDGE_VOICES.English.male,
    },
    characters: CHARACTER_GENDER,
    googleTtsRequired: false,
    kokoroRequired: false,
  });
});

export default router;