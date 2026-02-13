import {
  playIceSlideSound,
  playGlacierCrushSound,
  playInfernoSound,
  playBloomSound,
  playThornStormSound,
  playShadowSlideSound,
  playSoulDrainSound,
  playVoidCollapseSound,
  playMultiplySound,
  playThunderNapSound,
  playLightningDashSound,
  playVoltSurgeSound,
} from './synthesizers';

export const SYNTH_PRESETS: Record<string, () => void> = {
  'ice-slide': playIceSlideSound,
  'deep-boom': playGlacierCrushSound,
  inferno: playInfernoSound,
  bloom: playBloomSound,
  'thorn-storm': playThornStormSound,
  'shadow-slide': playShadowSlideSound,
  'soul-drain': playSoulDrainSound,
  'void-collapse': playVoidCollapseSound,
  multiply: playMultiplySound,
  'thunder-nap': playThunderNapSound,
  'lightning-dash': playLightningDashSound,
  'volt-surge': playVoltSurgeSound,
};
