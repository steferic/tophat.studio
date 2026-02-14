import type { SoundSlotId } from './soundSlots';

// ── Audio Effect Params ─────────────────────────────────────

export interface ReverbParams {
  enabled: boolean;
  mix: number;
  decay: number;
}
export interface DistortionParams {
  enabled: boolean;
  mix: number;
  drive: number;
}
export interface EchoParams {
  enabled: boolean;
  mix: number;
  delay: number;
  feedback: number;
}
export interface ReverseParams {
  enabled: boolean;
  mix: number;
}

export interface AudioEffects {
  reverb: ReverbParams;
  distortion: DistortionParams;
  echo: EchoParams;
  reverse: ReverseParams;
}

export const DEFAULT_EFFECTS: AudioEffects = {
  reverb: { enabled: false, mix: 0.5, decay: 1.5 },
  distortion: { enabled: false, mix: 0.5, drive: 50 },
  echo: { enabled: false, mix: 0.5, delay: 0.3, feedback: 0.4 },
  reverse: { enabled: false, mix: 1.0 },
};

/** Migrate V1 boolean effects to V2 structured params. */
export function migrateEffects(raw: unknown): AudioEffects {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_EFFECTS };

  const obj = raw as Record<string, unknown>;

  // Already V2 — has nested objects with `enabled`
  if (obj.reverb && typeof obj.reverb === 'object' && 'enabled' in (obj.reverb as object)) {
    return raw as AudioEffects;
  }

  // V1 — booleans: migrate, using mix=1.0 when previously enabled for identical playback
  return {
    reverb: {
      enabled: !!obj.reverb,
      mix: obj.reverb ? 1.0 : 0.5,
      decay: 1.5,
    },
    distortion: {
      enabled: !!obj.distortion,
      mix: obj.distortion ? 1.0 : 0.5,
      drive: 50,
    },
    echo: {
      enabled: !!obj.echo,
      mix: obj.echo ? 1.0 : 0.5,
      delay: 0.3,
      feedback: 0.4,
    },
    reverse: {
      enabled: !!obj.reverse,
      mix: obj.reverse ? 1.0 : 1.0,
    },
  };
}

export interface StoredRecording {
  cardId: string;
  slotId: SoundSlotId;
  audioData: ArrayBuffer;
  pitchRate: number; // 0.5–2.0, default 1.0
  effects: AudioEffects;
  createdAt: number;
}

// ── In-memory cache ──────────────────────────────────────────

const cache = new Map<string, StoredRecording>();

function cacheKey(cardId: string, slotId: SoundSlotId) {
  return `${cardId}:${slotId}`;
}

// ── IndexedDB helpers ────────────────────────────────────────

const DB_NAME = 'card-recordings';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(key: string): Promise<StoredRecording | undefined> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbPut(key: string, value: StoredRecording): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

function idbDelete(key: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      }),
  );
}

// ── Public API ───────────────────────────────────────────────

const SLOT_IDS: SoundSlotId[] = ['battle-cry', 'hit-react', 'status-react'];

/** Load all 3 slots for a card into the in-memory cache. */
export async function loadCardRecordings(cardId: string): Promise<void> {
  await Promise.all(
    SLOT_IDS.map(async (slotId) => {
      const key = cacheKey(cardId, slotId);
      if (cache.has(key)) return;
      const rec = await idbGet(key);
      if (rec) {
        rec.effects = migrateEffects(rec.effects);
        cache.set(key, rec);
      }
    }),
  );
}

/** Synchronous cache check — used at play time to avoid async. */
export function getCachedRecording(cardId: string, slotId: SoundSlotId): StoredRecording | null {
  return cache.get(cacheKey(cardId, slotId)) ?? null;
}

/** Save a recording to IndexedDB and cache. */
export async function saveRecording(
  cardId: string,
  slotId: SoundSlotId,
  audioData: ArrayBuffer,
  pitchRate: number,
  effects: AudioEffects = DEFAULT_EFFECTS,
): Promise<void> {
  const rec: StoredRecording = {
    cardId,
    slotId,
    audioData,
    pitchRate,
    effects,
    createdAt: Date.now(),
  };
  const key = cacheKey(cardId, slotId);
  await idbPut(key, rec);
  cache.set(key, rec);
}

/** Delete a recording from IndexedDB and cache. */
export async function deleteRecording(cardId: string, slotId: SoundSlotId): Promise<void> {
  const key = cacheKey(cardId, slotId);
  await idbDelete(key);
  cache.delete(key);
}

// ── Effect Node Helpers ──────────────────────────────────────

/** Cached reverb impulse response buffers keyed by "sampleRate:decay" */
const reverbImpulseCache = new Map<string, AudioBuffer>();

function getReverbImpulse(ctx: AudioContext, decay: number): AudioBuffer {
  const cacheKey = `${ctx.sampleRate}:${decay}`;
  const cached = reverbImpulseCache.get(cacheKey);
  if (cached) return cached;

  const length = Math.ceil(ctx.sampleRate * decay);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (decay * 0.27)));
    }
  }
  reverbImpulseCache.set(cacheKey, impulse);
  return impulse;
}

function createDistortion(ctx: AudioContext, drive: number): WaveShaperNode {
  const shaper = ctx.createWaveShaper();
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + drive) * x * 20 * deg) / (Math.PI + drive * Math.abs(x));
  }
  shaper.curve = curve;
  shaper.oversample = '4x';
  return shaper;
}

interface EffectIO {
  input: AudioNode;
  output: AudioNode;
}

function createEcho(ctx: AudioContext, delayTime: number, feedbackGain: number): EffectIO {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const delay = ctx.createDelay(1.0);
  delay.delayTime.value = delayTime;
  const feedback = ctx.createGain();
  feedback.gain.value = feedbackGain;

  // wet path only — dry/wet wrapper handles the dry signal
  input.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(output);

  return { input, output };
}

function createReverb(ctx: AudioContext, decay: number): ConvolverNode {
  const convolver = ctx.createConvolver();
  convolver.buffer = getReverbImpulse(ctx, decay);
  return convolver;
}

// ── Dry/Wet Wrapper ──────────────────────────────────────────

/**
 * Wraps an effect in a parallel dry/wet splitter:
 *
 *            ┌── dryGain (1-mix) ──┐
 *   input ───┤                     ├── output
 *            └── effect → wetGain ─┘
 */
function wrapWithDryWet(
  ctx: AudioContext,
  effectIn: AudioNode,
  effectOut: AudioNode,
  mix: number,
): EffectIO {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const dryGain = ctx.createGain();
  dryGain.gain.value = 1 - mix;

  const wetGain = ctx.createGain();
  wetGain.gain.value = mix;

  // dry path
  input.connect(dryGain);
  dryGain.connect(output);

  // wet path
  input.connect(effectIn);
  effectOut.connect(wetGain);
  wetGain.connect(output);

  return { input, output };
}

/** Buffer-level reverse with dry/wet mix blending */
function applyReverse(audioBuffer: AudioBuffer, mix: number): void {
  if (mix <= 0) return;

  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    // Make a copy of the original
    const original = new Float32Array(data);
    // Reverse the data in-place
    data.reverse();

    if (mix < 1) {
      // Blend: data[i] = original[i] * (1-mix) + reversed[i] * mix
      for (let i = 0; i < data.length; i++) {
        data[i] = original[i] * (1 - mix) + data[i] * mix;
      }
    }
    // mix === 1 → fully reversed, already done
  }
}

// ── Playback via Web Audio API ───────────────────────────────

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

/**
 * Play a cached custom recording with pitch shift and effects.
 * Chain: source → [distortion w/ dry/wet] → [echo w/ dry/wet] → [reverb w/ dry/wet] → destination
 * Reverse is applied at buffer level with dry/wet blending.
 * Returns true if a recording existed and was played, false otherwise.
 */
export function playCustomSound(cardId: string, slotId: SoundSlotId): boolean {
  const rec = getCachedRecording(cardId, slotId);
  if (!rec) return false;

  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();

  const copy = rec.audioData.slice(0);
  const effects = migrateEffects(rec.effects);

  ctx.decodeAudioData(copy).then((audioBuffer) => {
    // Reverse: buffer-level operation with dry/wet mix
    if (effects.reverse.enabled) {
      applyReverse(audioBuffer, effects.reverse.mix);
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = rec.pitchRate;

    // Build the effect chain with dry/wet wrappers
    let currentNode: AudioNode = source;

    if (effects.distortion.enabled) {
      const distNode = createDistortion(ctx, effects.distortion.drive);
      const wrapped = wrapWithDryWet(ctx, distNode, distNode, effects.distortion.mix);
      currentNode.connect(wrapped.input);
      currentNode = wrapped.output;
    }

    if (effects.echo.enabled) {
      const echo = createEcho(ctx, effects.echo.delay, effects.echo.feedback);
      const wrapped = wrapWithDryWet(ctx, echo.input, echo.output, effects.echo.mix);
      currentNode.connect(wrapped.input);
      currentNode = wrapped.output;
    }

    if (effects.reverb.enabled) {
      const reverb = createReverb(ctx, effects.reverb.decay);
      const wrapped = wrapWithDryWet(ctx, reverb, reverb, effects.reverb.mix);
      currentNode.connect(wrapped.input);
      currentNode = wrapped.output;
    }

    currentNode.connect(ctx.destination);
    source.start();
  });

  return true;
}
