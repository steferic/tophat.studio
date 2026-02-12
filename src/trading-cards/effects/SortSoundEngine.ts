// --- Shared sound engine for sorting visualizations ---
// Runs on a fixed-rate timer, decoupled from visual step speed.
// Both bubble sort and quick sort feed values into this and get
// identical-sounding tone patterns.

const generateTone = (frequency: number, duration = 0.05, volume = 0.15): string => {
  const sampleRate = 44100;
  const toneSamples = Math.floor(sampleRate * duration);
  const silencePadding = Math.floor(sampleRate * 0.05);
  const numSamples = toneSamples + silencePadding;
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < toneSamples; i++) {
    const t = i / sampleRate;
    const envelope = 0.5 * (1 - Math.cos((2 * Math.PI * i) / toneSamples));
    samples[i] = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
  }

  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let j = 0; j < str.length; j++) view.setUint8(offset + j, str.charCodeAt(j));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
};

/** Fixed interval (ms) between tone plays — identical for every algorithm */
const TONE_INTERVAL = 40;

export class SortSoundEngine {
  private tones: Record<number, string> = {};
  private timer: ReturnType<typeof setInterval> | null = null;
  private activeValue: number | null = null;

  constructor(barCount: number) {
    for (let i = 1; i <= barCount; i++) {
      const freq = 200 + ((i - 1) / (barCount - 1)) * 600;
      this.tones[i] = generateTone(freq, 0.04, 0.12);
    }
  }

  /** Update which bar value the engine should sonify on its next tick */
  setValue(value: number | null) {
    this.activeValue = value;
  }

  /** Start the fixed-rate tone timer */
  start() {
    this.stop();
    this.timer = setInterval(() => {
      const v = this.activeValue;
      if (v && this.tones[v]) {
        const audio = new Audio(this.tones[v]);
        audio.play().catch(() => {});
      }
    }, TONE_INTERVAL);
  }

  /** Stop the timer and clear state */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.activeValue = null;
  }
}
