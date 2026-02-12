import type { AttackAudioDescriptor, VoiceLineDescriptor } from '../arena/descriptorTypes';
import { SYNTH_PRESETS } from '../audio/synthPresets';

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
