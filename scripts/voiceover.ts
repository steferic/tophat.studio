import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

const API_BASE = "https://api.elevenlabs.io";

// --- Types ---

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

interface TimestampResponse {
  audio_base64: string;
  alignment: {
    characters: string[];
    character_start_times_seconds: number[];
    character_end_times_seconds: number[];
  };
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

export interface SubtitleSegment {
  text: string;
  startTime: number;
  endTime: number;
  words: WordTiming[];
}

// --- Helpers ---

function loadApiKey(): string {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.error("Error: .env file not found. Create one with ELEVEN_LABS_API_KEY=your_key");
    process.exit(1);
  }
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("ELEVEN_LABS_API_KEY=")) {
      const value = trimmed.slice("ELEVEN_LABS_API_KEY=".length).trim();
      if (!value || value === "your_api_key_here") {
        console.error("Error: ELEVEN_LABS_API_KEY is not set in .env");
        process.exit(1);
      }
      return value;
    }
  }
  console.error("Error: ELEVEN_LABS_API_KEY not found in .env");
  process.exit(1);
}

async function getVoices(apiKey: string): Promise<Voice[]> {
  const res = await fetch(`${API_BASE}/v1/voices`, {
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Error fetching voices (${res.status}): ${body}`);
    process.exit(1);
  }
  const data = (await res.json()) as { voices: Voice[] };
  return data.voices;
}

async function resolveVoiceId(apiKey: string, name: string): Promise<string> {
  const voices = await getVoices(apiKey);
  const lower = name.toLowerCase();
  const match = voices.find(
    (v) =>
      v.name.toLowerCase() === lower ||
      v.name.toLowerCase().startsWith(lower + " ") ||
      v.name.toLowerCase().startsWith(lower + " -"),
  );
  if (!match) {
    console.error(`Voice "${name}" not found. Available voices:`);
    for (const v of voices) {
      console.error(`  - ${v.name} (${v.category})`);
    }
    process.exit(1);
  }
  return match.voice_id;
}

async function generateSpeech(
  apiKey: string,
  voiceId: string,
  text: string,
  options: {
    model: string;
    stability: number;
    similarity: number;
    style: number;
  }
): Promise<Buffer> {
  const res = await fetch(`${API_BASE}/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: options.model,
      voice_settings: {
        stability: options.stability,
        similarity_boost: options.similarity,
        style: options.style,
      },
    }),
  });
  if (!res.ok) {
    let detail: string;
    try {
      const json = (await res.json()) as { detail?: { message?: string } };
      detail = json.detail?.message ?? JSON.stringify(json);
    } catch {
      detail = await res.text();
    }
    console.error(`ElevenLabs API error (${res.status}): ${detail}`);
    process.exit(1);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

async function generateSpeechWithTimestamps(
  apiKey: string,
  voiceId: string,
  text: string,
  options: {
    model: string;
    stability: number;
    similarity: number;
    style: number;
  }
): Promise<{ audio: Buffer; subtitles: SubtitleSegment[] }> {
  const res = await fetch(`${API_BASE}/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: options.model,
      voice_settings: {
        stability: options.stability,
        similarity_boost: options.similarity,
        style: options.style,
      },
    }),
  });
  if (!res.ok) {
    let detail: string;
    try {
      const json = (await res.json()) as { detail?: { message?: string } };
      detail = json.detail?.message ?? JSON.stringify(json);
    } catch {
      detail = await res.text();
    }
    console.error(`ElevenLabs API error (${res.status}): ${detail}`);
    process.exit(1);
  }

  const data = (await res.json()) as TimestampResponse;
  const audio = Buffer.from(data.audio_base64, "base64");
  const subtitles = buildSubtitles(data.alignment);

  return { audio, subtitles };
}

/**
 * Convert character-level timestamps to word-level and sentence-level segments.
 * Groups by sentences (ending with . ! ?) for natural subtitle breaks.
 * Each segment includes word-level timing for karaoke-style highlighting.
 */
function buildSubtitles(alignment: TimestampResponse["alignment"]): SubtitleSegment[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;

  // First, build word timings from character data
  const allWords: WordTiming[] = [];
  let currentWord = "";
  let wordStart: number | null = null;
  let wordEnd = 0;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const startTime = character_start_times_seconds[i];
    const endTime = character_end_times_seconds[i];

    if (char === " " || char === "\n") {
      // End of word
      if (currentWord.trim() && wordStart !== null) {
        allWords.push({
          word: currentWord,
          startTime: wordStart,
          endTime: wordEnd,
        });
      }
      currentWord = "";
      wordStart = null;
    } else {
      // Part of a word
      if (wordStart === null) {
        wordStart = startTime;
      }
      currentWord += char;
      wordEnd = endTime;
    }
  }

  // Capture last word
  if (currentWord.trim() && wordStart !== null) {
    allWords.push({
      word: currentWord,
      startTime: wordStart,
      endTime: wordEnd,
    });
  }

  // Now group words into sentence segments
  const segments: SubtitleSegment[] = [];
  let segmentWords: WordTiming[] = [];
  let segmentText = "";

  for (let i = 0; i < allWords.length; i++) {
    const wordTiming = allWords[i];
    segmentWords.push(wordTiming);
    segmentText += (segmentText ? " " : "") + wordTiming.word;

    // Check if this word ends a sentence
    const lastChar = wordTiming.word.slice(-1);
    const isSentenceEnd = lastChar === "." || lastChar === "!" || lastChar === "?";

    // Check if this word contains an em-dash and segment is long enough
    const hasEmDash = wordTiming.word.includes("—") && segmentText.length > 25;

    if (isSentenceEnd || hasEmDash || i === allWords.length - 1) {
      if (segmentWords.length > 0) {
        segments.push({
          text: segmentText.trim(),
          startTime: segmentWords[0].startTime,
          endTime: segmentWords[segmentWords.length - 1].endTime,
          words: [...segmentWords],
        });
      }
      segmentWords = [];
      segmentText = "";
    }
  }

  return segments;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function parseArgs(argv: string[]) {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        flags[arg.slice(2)] = "true";
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  const apiKey = loadApiKey();

  // --list-voices
  if (flags["list-voices"] !== undefined) {
    const voices = await getVoices(apiKey);
    console.log(`\nAvailable voices (${voices.length}):\n`);
    console.log("  Name                     Category");
    console.log("  " + "-".repeat(45));
    for (const v of voices) {
      console.log(`  ${v.name.padEnd(25)}${v.category}`);
    }
    return;
  }

  // Text is required for generation
  const text = positional[0];
  if (!text) {
    console.error("Usage: npx tsx scripts/voiceover.ts \"Your text here\" [options]");
    console.error("       npx tsx scripts/voiceover.ts --list-voices");
    console.error("\nOptions:");
    console.error("  --voice=Name          Voice name (default: Rachel)");
    console.error("  --model=id            Model ID (default: eleven_multilingual_v2)");
    console.error("  --output=file.mp3     Output filename (default: auto from text)");
    console.error("  --subtitles           Generate subtitle JSON file alongside audio");
    console.error("  --stability=N         Stability 0-1 (default: 0.5)");
    console.error("  --similarity=N        Similarity boost 0-1 (default: 0.75)");
    console.error("  --style=N             Style exaggeration 0-1 (default: 0.0)");
    process.exit(1);
  }

  const voiceName = flags["voice"] ?? "Rachel";
  const model = flags["model"] ?? "eleven_multilingual_v2";
  const stability = parseFloat(flags["stability"] ?? "0.5");
  const similarity = parseFloat(flags["similarity"] ?? "0.75");
  const style = parseFloat(flags["style"] ?? "0.0");
  const withSubtitles = flags["subtitles"] !== undefined;
  const outputFile = flags["output"] ?? `${slugify(text)}.mp3`;
  const subtitleFile = outputFile.replace(/\.mp3$/, ".json");

  console.log(`Voice: ${voiceName}`);
  console.log(`Model: ${model}`);
  console.log(`Output: public/audio/voiceovers/${outputFile}`);
  if (withSubtitles) {
    console.log(`Subtitles: public/audio/voiceovers/${subtitleFile}`);
  }
  console.log(`Text: "${text}"\n`);

  // Resolve voice name to ID
  const voiceId = await resolveVoiceId(apiKey, voiceName);

  // Generate speech
  console.log("Generating speech...");

  const audioDir = join(process.cwd(), "public", "audio", "voiceovers");
  mkdirSync(audioDir, { recursive: true });

  if (withSubtitles) {
    const { audio, subtitles } = await generateSpeechWithTimestamps(apiKey, voiceId, text, {
      model,
      stability,
      similarity,
      style,
    });

    const outPath = join(audioDir, outputFile);
    const subPath = join(audioDir, subtitleFile);

    try {
      writeFileSync(outPath, audio);
      writeFileSync(subPath, JSON.stringify(subtitles, null, 2));
    } catch (err) {
      console.error(`Failed to write files: ${err}`);
      process.exit(1);
    }

    console.log(`Saved ${(audio.length / 1024).toFixed(1)} KB to ${outPath}`);
    console.log(`Saved ${subtitles.length} subtitle segments to ${subPath}`);
    console.log(`\nUsage in Remotion:`);
    console.log(`  import subtitles from '../public/audio/voiceovers/${subtitleFile}';`);
    console.log(`  <Audio src={staticFile('audio/voiceovers/${outputFile}')} />`);
    console.log(`  <Subtitles segments={subtitles} />`);
  } else {
    const audio = await generateSpeech(apiKey, voiceId, text, {
      model,
      stability,
      similarity,
      style,
    });

    const outPath = join(audioDir, outputFile);

    try {
      writeFileSync(outPath, audio);
    } catch (err) {
      console.error(`Failed to write file: ${err}`);
      process.exit(1);
    }

    console.log(`Saved ${(audio.length / 1024).toFixed(1)} KB to ${outPath}`);
    console.log(`\nUsage in Remotion:\n  <Audio src={staticFile('audio/voiceovers/${outputFile}')} />`);
  }
}

main();
