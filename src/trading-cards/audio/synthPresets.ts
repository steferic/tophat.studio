import {
  playIceSlideSound,
  playGlacierCrushSound,
  playInfernoSound,
  playBloomSound,
  playThornStormSound,
} from './synthesizers';

export const SYNTH_PRESETS: Record<string, () => void> = {
  'ice-slide': playIceSlideSound,
  'deep-boom': playGlacierCrushSound,
  inferno: playInfernoSound,
  bloom: playBloomSound,
  'thorn-storm': playThornStormSound,
};
