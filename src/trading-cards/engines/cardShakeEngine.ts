import type { CardShakeDescriptor } from '../arena/descriptorTypes';

export interface CardShakeResult {
  transform?: string;
}

export function computeCardShake(
  elapsed: number,
  descriptor: CardShakeDescriptor,
): CardShakeResult {
  const intensity = descriptor.intensity ?? 1;

  switch (descriptor.pattern) {
    case 'sway': {
      // Horizontal sway that decays over duration
      const decay = Math.max(0, 1 - elapsed / descriptor.duration);
      const sway = Math.sin(elapsed * 12) * decay * 6 * intensity;
      return {
        transform: `translateX(${sway}px) rotate(${sway * 0.167}deg)`,
      };
    }

    case 'slam': {
      // Rise then slam with aftershake
      let shakeX = 0;
      let shakeY = 0;
      if (elapsed < 0.1) {
        shakeY = -4 * (elapsed / 0.1) * intensity;
      } else if (elapsed < 0.7) {
        const shake = Math.sin(elapsed * 40) * Math.max(0, 1 - (elapsed - 0.1) * 1.67);
        shakeX = shake * 5 * intensity;
        shakeY = shake * 2 * intensity;
      }
      return {
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      };
    }

    case 'spin': {
      // Scale pulse + rotation
      const decay = Math.max(0, 1 - elapsed / descriptor.duration);
      const shake = Math.sin(elapsed * 25) * decay;
      const scaleOff = 1 + Math.sin(elapsed * 14) * 0.04 * decay * intensity;
      return {
        transform: `scale(${scaleOff}) rotate(${shake * 2 * intensity}deg)`,
      };
    }

    case 'pulse': {
      // Gentle rise + scale pulse (bloom-style)
      const ramp = elapsed < 0.3 ? elapsed / 0.3 : 1;
      const decay = elapsed < 0.3 ? 1 : Math.max(0, 1 - (elapsed - 0.3) / (descriptor.duration - 0.3));
      const combined = ramp * decay;
      const sway = Math.sin(elapsed * 2) * 2 * combined * intensity;
      return {
        transform: `translateY(${-sway}px) scale(${1 + combined * 0.02 * intensity})`,
      };
    }

    case 'contract': {
      // Inward scale contraction
      const ramp = elapsed < 0.2 ? elapsed / 0.2 : 1;
      const decay = elapsed < 0.2 ? 1 : Math.max(0, 1 - (elapsed - 0.2) / (descriptor.duration - 0.2));
      const combined = ramp * decay;
      return {
        transform: `scale(${1 - combined * 0.03 * intensity})`,
      };
    }

    default:
      return {};
  }
}
