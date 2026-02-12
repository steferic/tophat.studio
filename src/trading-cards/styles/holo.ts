/**
 * Frame-driven holographic effect helpers.
 * Replaces CSS @property animations with pure functions.
 */

/** Rotating holo angle (replaces --holo-angle CSS property) */
export const holoAngle = (frame: number, fps: number, speed = 1): number => {
  const t = frame / fps;
  return (t * 120 * speed) % 360;
};

/** Sweeping angle that oscillates back and forth (replaces header/stats/flavor sweeps) */
export const sweepAngle = (
  frame: number,
  fps: number,
  speed = 1,
  range: [number, number] = [-30, 330],
): number => {
  const t = frame / fps;
  const progress = (Math.sin(t * speed * Math.PI * 2 * 0.167) + 1) / 2; // ~3s cycle at speed=1
  return range[0] + progress * (range[1] - range[0]);
};

/** Card border holographic gradient */
export const holoGradient = (angle: number): string => {
  return `linear-gradient(${angle}deg, rgba(255,0,128,0.5), rgba(255,200,0,0.45), rgba(0,255,128,0.5), rgba(0,180,255,0.55), rgba(180,0,255,0.5), rgba(255,0,128,0.5))`;
};

/** Header purple/blue metallic sweep gradient */
export const headerShimmer = (angle: number): string => {
  return `linear-gradient(${angle}deg, transparent 0%, rgba(140,80,255,0.3) 30%, rgba(80,200,255,0.35) 50%, rgba(200,80,255,0.3) 70%, transparent 100%)`;
};

/** Art window holographic sweep */
export const artShimmer = (angle: number, opacity: number): string => {
  return `linear-gradient(${angle}deg, transparent 0%, rgba(255,100,200,${0.12 * opacity}) 20%, rgba(100,255,200,${0.12 * opacity}) 40%, transparent 50%, rgba(100,200,255,${0.15 * opacity}) 65%, rgba(255,200,100,${0.12 * opacity}) 80%, transparent 100%)`;
};

/** Art window shimmer opacity (pulses between 0.4 and 0.8) */
export const artShimmerOpacity = (frame: number, fps: number): number => {
  const t = frame / fps;
  return 0.4 + (Math.sin(t * Math.PI * 2 * 0.167) + 1) / 2 * 0.4;
};

/** Attacks section conic gradient shimmer */
export const attacksShimmer = (angle: number): string => {
  return `conic-gradient(from ${angle}deg at 50% 50%, transparent, rgba(255,180,50,0.25), rgba(255,100,150,0.2), transparent, rgba(255,220,80,0.25), rgba(255,120,80,0.2), transparent)`;
};

/** Stats bar chrome sliding highlight */
export const statsShimmer = (angle: number): string => {
  return `linear-gradient(${angle}deg, transparent 0%, rgba(200,220,255,0.35) 40%, rgba(255,255,255,0.5) 50%, rgba(200,220,255,0.35) 60%, transparent 100%)`;
};

/** Flavor text green/teal prismatic glint */
export const flavorShimmer = (angle: number): string => {
  return `linear-gradient(${angle}deg, transparent 0%, rgba(0,255,180,0.2) 35%, rgba(80,255,220,0.3) 50%, rgba(0,200,255,0.2) 65%, transparent 100%)`;
};

/** Default card box-shadow */
export const defaultCardShadow = '0 0 40px rgba(245,212,66,0.15), 0 16px 48px rgba(0,0,0,0.6)';

/** Energy type emoji mapping */
export const energyEmoji: Record<string, string> = {
  water: '\uD83D\uDCA7',
  fire: '\uD83D\uDD25',
  colorless: '\u2B50',
  psychic: '\uD83D\uDD2E',
  fighting: '\uD83D\uDC4A',
  grass: '\uD83C\uDF3F',
};

/**
 * Legacy art window attack glow. Used as fallback when no ArtGlowDescriptor is provided.
 * New cards should use the glow engine via descriptors instead.
 */
export const artWindowGlow = (
  attack: string | null,
  frame: number,
  fps: number,
  attackStartFrame: number,
): string => {
  const base = 'inset 0 1px 6px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.3)';
  if (!attack) return base;

  const elapsed = (frame - attackStartFrame) / fps;

  if (attack === 'ice-slide') {
    const intensity = elapsed < 0.1 ? elapsed / 0.1 : Math.max(0, 1 - (elapsed - 0.1) / 0.4);
    return `inset 0 0 ${40 * intensity}px rgba(150,220,255,${0.7 * intensity}), 0 1px 0 rgba(255,255,255,0.3)`;
  }

  if (attack === 'glacier-crush') {
    let intensity: number;
    if (elapsed < 0.09) {
      intensity = elapsed / 0.09;
    } else if (elapsed < 0.18) {
      intensity = 1;
    } else {
      intensity = Math.max(0, 1 - (elapsed - 0.18) / 0.42);
    }
    return `inset 0 0 ${50 * intensity}px rgba(100,180,255,${0.6 * intensity}), inset 0 0 ${20 * intensity}px rgba(255,255,255,${0.8 * intensity}), 0 1px 0 rgba(255,255,255,0.3)`;
  }

  if (attack === 'inferno') {
    let intensity: number;
    if (elapsed < 0.08) {
      intensity = elapsed / 0.08;
    } else if (elapsed < 0.24) {
      intensity = 1;
    } else {
      intensity = Math.max(0, 1 - (elapsed - 0.24) / 1.36);
    }
    return `inset 0 0 ${80 * intensity}px rgba(255,80,0,${0.9 * intensity}), inset 0 ${-40 * intensity}px ${60 * intensity}px rgba(255,0,0,${0.7 * intensity}), inset 0 0 ${20 * intensity}px rgba(255,255,200,${0.4 * intensity}), 0 1px 0 rgba(255,255,255,0.3)`;
  }

  if (attack === 'bloom') {
    const intensity = elapsed < 0.2 ? elapsed / 0.2 : Math.max(0, 1 - (elapsed - 0.2) / 2.8);
    return `inset 0 0 ${50 * intensity}px rgba(255,150,200,${0.7 * intensity}), inset 0 0 ${25 * intensity}px rgba(255,220,180,${0.5 * intensity}), 0 1px 0 rgba(255,255,255,0.3)`;
  }

  if (attack === 'thorn-storm') {
    const intensity = elapsed < 0.1 ? elapsed / 0.1 : Math.max(0, 1 - (elapsed - 0.1) / 1.9);
    return `inset 0 0 ${60 * intensity}px rgba(200,0,50,${0.8 * intensity}), inset 0 0 ${30 * intensity}px rgba(255,80,100,${0.5 * intensity}), 0 1px 0 rgba(255,255,255,0.3)`;
  }

  if (attack === 'cube') {
    const intensity = elapsed < 0.15 ? elapsed / 0.15 : Math.max(0, 1 - (elapsed - 0.15) / 1.35);
    return `inset 0 0 ${45 * intensity}px rgba(80,0,120,${0.8 * intensity}), inset 0 0 ${25 * intensity}px rgba(0,0,0,${0.6 * intensity}), 0 1px 0 rgba(255,255,255,0.3)`;
  }

  return base;
};
