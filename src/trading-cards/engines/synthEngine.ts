import type { AttackAudioDescriptor, VoiceLineDescriptor } from '../arena/descriptorTypes';
import { SYNTH_PRESETS } from '../audio/synthPresets';
import { playCustomSound } from '../audio/recordingStore';
import { playHitLightSound, playHitHeavySound } from '../audio';

export function playAttackSound(descriptor: AttackAudioDescriptor) {
  if (descriptor.type === 'synth') {
    const play = SYNTH_PRESETS[descriptor.synthPreset];
    if (play) play();
  } else {
    const audio = new Audio(descriptor.filePath);
    audio.volume = descriptor.volume ?? 0.85;
    audio.play().catch(() => {});
  }
}

export function playVoiceLineFromDescriptor(descriptor: VoiceLineDescriptor | undefined) {
  if (!descriptor) return;
  const audio = new Audio(descriptor.filePath);
  audio.volume = descriptor.volume ?? 0.85;
  audio.play().catch(() => {});
}

// ── Recording-aware wrappers ─────────────────────────────────

export function playVoiceLineOrCustom(
  cardId: string,
  descriptor: VoiceLineDescriptor | undefined,
) {
  if (playCustomSound(cardId, 'battle-cry')) return;
  playVoiceLineFromDescriptor(descriptor);
}

export function playHitSoundOrCustom(
  cardId: string,
  hitType: 'hit-light' | 'hit-heavy',
) {
  if (playCustomSound(cardId, 'hit-react')) return;
  if (hitType === 'hit-heavy') playHitHeavySound();
  else playHitLightSound();
}

export function playStatusReactSound(cardId: string) {
  playCustomSound(cardId, 'status-react');
}
