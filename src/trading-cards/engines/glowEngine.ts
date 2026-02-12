import type { GlowDescriptor, ArtGlowDescriptor } from '../arena/descriptorTypes';

function computeIntensity(
  elapsed: number,
  duration: number,
  fadeProfile: GlowDescriptor['fadeProfile'],
): number {
  const t = Math.min(elapsed / duration, 1);
  switch (fadeProfile) {
    case 'linear':
      return Math.max(0, 1 - t);
    case 'ease-out':
      return Math.max(0, 1 - t * t);
    case 'hold-then-fade': {
      if (t < 0.3) return t / 0.3;
      return Math.max(0, 1 - (t - 0.3) / 0.7);
    }
    default:
      return Math.max(0, 1 - t);
  }
}

export function computeGlowShadow(
  elapsed: number,
  duration: number,
  descriptor: GlowDescriptor,
): string {
  const i = computeIntensity(elapsed, duration, descriptor.fadeProfile);
  const [r, g, b] = descriptor.color;
  const baseShadow = `0 0 ${descriptor.radius * i}px rgba(${r},${g},${b},${descriptor.maxOpacity * i})`;

  const layers = descriptor.layers ?? [];
  const layerShadows = layers.map((layer) => {
    const [lr, lg, lb] = layer.color;
    return `0 0 ${layer.radius * i}px rgba(${lr},${lg},${lb},${layer.maxOpacity * i})`;
  });

  return [...[baseShadow], ...layerShadows, '0 16px 48px rgba(0,0,0,0.6)'].join(', ');
}

export function computeArtGlow(
  elapsed: number,
  descriptor: ArtGlowDescriptor,
): string {
  const base = 'inset 0 1px 6px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.3)';

  let intensity: number;
  if (elapsed < descriptor.fadeIn) {
    intensity = elapsed / descriptor.fadeIn;
  } else if (descriptor.holdDuration && elapsed < descriptor.fadeIn + descriptor.holdDuration) {
    intensity = 1;
  } else {
    const fadeStart = descriptor.fadeIn + (descriptor.holdDuration ?? 0);
    intensity = Math.max(0, 1 - (elapsed - fadeStart) / descriptor.fadeOut);
  }

  const [r, g, b] = descriptor.color;
  let shadow = `inset 0 0 ${descriptor.radius * intensity}px rgba(${r},${g},${b},${descriptor.maxOpacity * intensity})`;

  if (descriptor.layers) {
    for (const layer of descriptor.layers) {
      const [lr, lg, lb] = layer.color;
      shadow += `, inset 0 0 ${layer.radius * intensity}px rgba(${lr},${lg},${lb},${layer.maxOpacity * intensity})`;
    }
  }

  shadow += ', 0 1px 0 rgba(255,255,255,0.3)';

  return intensity > 0 ? shadow : base;
}
