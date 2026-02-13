import type { CardTheme } from './cardTheme';
import type { EnergyType } from '../types';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends (...args: unknown[]) => unknown
      ? T[P]
      : DeepPartial<T[P]>
    : T[P];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepMerge<T>(base: T, ...patches: DeepPartial<T>[]): T {
  const result = { ...base } as Record<string, any>;
  for (const patch of patches) {
    if (!patch) continue;
    for (const key of Object.keys(patch as object)) {
      const val = (patch as Record<string, any>)[key];
      if (val === undefined) continue;
      const baseVal = result[key];
      if (
        val !== null &&
        typeof val === 'object' &&
        !Array.isArray(val) &&
        typeof val !== 'function' &&
        baseVal !== null &&
        typeof baseVal === 'object' &&
        !Array.isArray(baseVal) &&
        typeof baseVal !== 'function'
      ) {
        result[key] = deepMerge(baseVal, val);
      } else {
        result[key] = val;
      }
    }
  }
  return result as T;
}

export const TYPE_PRESETS: Record<EnergyType, DeepPartial<CardTheme>> = {
  // Water is the current default look — no overrides needed
  water: {},

  fire: {
    shell: {
      borderBackground: 'linear-gradient(160deg, #f5a623 0%, #d4451a 100%)',
      boxShadow: '0 0 40px rgba(245,120,40,0.2), 0 16px 48px rgba(0,0,0,0.6)',
      innerBackground: 'linear-gradient(180deg, #d4451a 0%, #c23a15 6%, #f5ebe0 6%, #f5ebe0 100%)',
    },
    header: {
      hpColor: '#d4451a',
    },
    attacks: {
      activeHighlight: 'rgba(212,69,26,0.2)',
    },
    holo: {
      border: (angle: number) =>
        `linear-gradient(${angle}deg, rgba(255,80,0,0.5), rgba(255,200,0,0.5), rgba(255,120,0,0.5), rgba(255,50,0,0.45), rgba(255,180,0,0.5), rgba(255,80,0,0.5))`,
    },
  },

  grass: {
    shell: {
      borderBackground: 'linear-gradient(160deg, #7bc67e 0%, #3a8a3e 100%)',
      boxShadow: '0 0 40px rgba(80,180,80,0.15), 0 16px 48px rgba(0,0,0,0.6)',
      innerBackground: 'linear-gradient(180deg, #4a9e5a 0%, #3a824a 6%, #e8f0e8 6%, #e8f0e8 100%)',
    },
    header: {
      hpColor: '#2d7a32',
    },
    attacks: {
      activeHighlight: 'rgba(74,158,90,0.2)',
    },
    holo: {
      border: (angle: number) =>
        `linear-gradient(${angle}deg, rgba(0,255,80,0.5), rgba(200,255,0,0.45), rgba(0,200,100,0.5), rgba(80,255,180,0.5), rgba(0,255,80,0.5))`,
    },
  },

  electric: {
    shell: {
      borderBackground: 'linear-gradient(160deg, #f5e642 0%, #d4a017 100%)',
      boxShadow: '0 0 40px rgba(245,230,66,0.2), 0 16px 48px rgba(0,0,0,0.6)',
      innerBackground: 'linear-gradient(180deg, #c9a820 0%, #b89618 6%, #f5f0d8 6%, #f5f0d8 100%)',
    },
    header: {
      hpColor: '#b8860b',
    },
    attacks: {
      activeHighlight: 'rgba(200,180,40,0.2)',
    },
  },

  psychic: {
    shell: {
      borderBackground: 'linear-gradient(160deg, #b87fd4 0%, #7b2fa0 100%)',
      boxShadow: '0 0 40px rgba(160,80,200,0.2), 0 16px 48px rgba(0,0,0,0.6)',
      innerBackground: 'linear-gradient(180deg, #9050b0 0%, #7a40a0 6%, #f0e8f5 6%, #f0e8f5 100%)',
    },
    header: {
      hpColor: '#8030a0',
    },
    attacks: {
      activeHighlight: 'rgba(140,60,200,0.2)',
    },
    holo: {
      border: (angle: number) =>
        `linear-gradient(${angle}deg, rgba(180,0,255,0.5), rgba(255,0,200,0.45), rgba(100,0,255,0.5), rgba(200,50,255,0.5), rgba(180,0,255,0.5))`,
    },
  },

  fighting: {
    shell: {
      borderBackground: 'linear-gradient(160deg, #c9935a 0%, #8b5e3c 100%)',
      boxShadow: '0 0 40px rgba(180,120,60,0.15), 0 16px 48px rgba(0,0,0,0.6)',
      innerBackground: 'linear-gradient(180deg, #a07050 0%, #8a6040 6%, #f0e8e0 6%, #f0e8e0 100%)',
    },
    header: {
      hpColor: '#8b4513',
    },
    attacks: {
      activeHighlight: 'rgba(160,100,50,0.2)',
    },
  },

  colorless: {
    shell: {
      borderBackground: 'linear-gradient(160deg, #d0d0d0 0%, #a0a0a0 100%)',
      boxShadow: '0 0 40px rgba(180,180,180,0.15), 0 16px 48px rgba(0,0,0,0.6)',
      innerBackground: 'linear-gradient(180deg, #a0a8b0 0%, #8a929a 6%, #eaeaea 6%, #eaeaea 100%)',
    },
    header: {
      hpColor: '#666',
    },
    attacks: {
      activeHighlight: 'rgba(120,120,120,0.2)',
    },
  },
};
