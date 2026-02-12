const VOICE_LINES: Record<string, string> = {
  'ice-slide': '/audio/voiceovers/pengo-aura-farm.mp3',
  'glacier-crush': '/audio/voiceovers/pengo-diagnose.mp3',
  inferno: '/audio/voiceovers/pengo-hellfire.mp3',
};

export function playVoiceLine(attackKey: string) {
  const src = VOICE_LINES[attackKey];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = 0.85;
  audio.play().catch(() => {});
}
