import type { EnergyType } from '../types';

// ── Visual Config ──────────────────────────────────────────

export interface StatusEffectVisualConfig {
  /** Hex color tint applied to model meshes */
  modelTint?: string;
  modelTintOpacity?: number;
  /** Ambient glow color around model */
  auraColor?: string;
  auraIntensity?: number;
  /** Particle system to spawn */
  particleSystem?: string;
  particleMode?: string;
  /** Colored border pulse on the card */
  cardBorderColor?: string;
  /** Semi-transparent overlay tint on the card */
  cardOverlayColor?: string;
  /** Prison-style container (like cube) */
  prison?: {
    geometry: 'cube' | 'sphere';
    color: string;
    edgeColor: string;
    opacity: number;
  };
}

// ── Blueprint ──────────────────────────────────────────────

export interface StatusEffectBlueprint {
  id: string;
  displayName: string;
  /** Emoji or icon key for HUD badges */
  icon: string;

  // ── Timing ──
  defaultDurationMs: number;

  // ── Behavior ──
  /** Blocks the player from attacking */
  preventsAttack?: boolean;
  /** Damage per tick */
  tickDamage?: number;
  /** Healing per tick */
  tickHeal?: number;
  /** Tick interval in ms (default: fires once at each turn start) */
  tickIntervalMs?: number;
  /** Multiplies outgoing damage */
  damageMultiplier?: number;
  /** Multiplies incoming damage (> 1 = takes more, < 1 = takes less) */
  incomingDamageMultiplier?: number;
  /** Chance [0-1] attack hits self instead of target */
  accuracyPenalty?: number;

  // ── Cure rules ──
  /** Blueprint IDs that remove this effect when applied */
  curedBy?: string[];
  /** Energy types whose attacks cure this effect */
  curedByTypes?: EnergyType[];
  /** Can't be applied while any of these effects are active */
  immuneWhile?: string[];

  // ── Stacking ──
  /** Whether multiple instances can stack (default: false, refreshes duration) */
  stackable?: boolean;
  /** Max stacks if stackable */
  maxStacks?: number;

  // ── Visual ──
  visual: StatusEffectVisualConfig;
}

// ── Registry ───────────────────────────────────────────────

export const STATUS_REGISTRY: Record<string, StatusEffectBlueprint> = {
  // ── Cube (existing — Rosalind) ──
  cube: {
    id: 'cube',
    displayName: 'Cubed',
    icon: '🟪',
    defaultDurationMs: 5_000,
    preventsAttack: true,
    visual: {
      prison: {
        geometry: 'cube',
        color: '#020008',
        edgeColor: '#8844ff',
        opacity: 0.35,
      },
      cardOverlayColor: 'rgba(80,0,120,0.1)',
    },
  },

  // ── Multiply (existing — Evil Pengo self-buff) ──
  multiply: {
    id: 'multiply',
    displayName: 'Multiplied',
    icon: '✖️',
    defaultDurationMs: 60_000,
    damageMultiplier: 2,
    visual: {
      auraColor: '#a855f7',
      auraIntensity: 0.4,
      cardBorderColor: '#a855f7',
    },
  },

  // ── Burned ──
  burned: {
    id: 'burned',
    displayName: 'Burned',
    icon: '🔥',
    defaultDurationMs: 15_000,
    tickDamage: 10,
    tickIntervalMs: 3_000,
    curedByTypes: ['water'],
    visual: {
      modelTint: '#ff4400',
      modelTintOpacity: 0.15,
      particleSystem: 'fire',
      particleMode: 'smolder',
      cardBorderColor: '#ff4400',
    },
  },

  // ── Poisoned ──
  poisoned: {
    id: 'poisoned',
    displayName: 'Poisoned',
    icon: '☠️',
    defaultDurationMs: 30_000,
    tickDamage: 5,
    tickIntervalMs: 2_000,
    stackable: true,
    maxStacks: 5,
    visual: {
      modelTint: '#22c55e',
      modelTintOpacity: 0.12,
      auraColor: '#22c55e',
      auraIntensity: 0.25,
      cardOverlayColor: 'rgba(34,197,94,0.08)',
    },
  },

  // ── Confused ──
  confused: {
    id: 'confused',
    displayName: 'Confused',
    icon: '💫',
    defaultDurationMs: 8_000,
    accuracyPenalty: 0.3,
    visual: {
      cardBorderColor: '#facc15',
      cardOverlayColor: 'rgba(250,204,21,0.06)',
    },
  },

  // ── Sleep ──
  sleep: {
    id: 'sleep',
    displayName: 'Asleep',
    icon: '💤',
    defaultDurationMs: 10_000,
    preventsAttack: true,
    curedBy: ['angry'],
    visual: {
      modelTint: '#6366f1',
      modelTintOpacity: 0.1,
      cardOverlayColor: 'rgba(0,0,80,0.12)',
    },
  },

  // ── Slowed ──
  slowed: {
    id: 'slowed',
    displayName: 'Slowed',
    icon: '🐌',
    defaultDurationMs: 12_000,
    visual: {
      modelTint: '#94a3b8',
      modelTintOpacity: 0.15,
      auraColor: '#94a3b8',
      auraIntensity: 0.2,
      cardOverlayColor: 'rgba(148,163,184,0.1)',
    },
  },

  // ── Cursed ──
  cursed: {
    id: 'cursed',
    displayName: 'Cursed',
    icon: '💀',
    defaultDurationMs: 20_000,
    tickDamage: 8,
    tickIntervalMs: 4_000,
    incomingDamageMultiplier: 1.3,
    visual: {
      modelTint: '#4c1d95',
      modelTintOpacity: 0.2,
      auraColor: '#7c3aed',
      auraIntensity: 0.35,
      cardBorderColor: '#7c3aed',
    },
  },

  // ── Sad ──
  sad: {
    id: 'sad',
    displayName: 'Sad',
    icon: '😢',
    defaultDurationMs: 15_000,
    damageMultiplier: 0.7,
    curedBy: ['happy'],
    visual: {
      modelTint: '#60a5fa',
      modelTintOpacity: 0.12,
      cardOverlayColor: 'rgba(96,165,250,0.1)',
    },
  },

  // ── Happy ──
  happy: {
    id: 'happy',
    displayName: 'Happy',
    icon: '😊',
    defaultDurationMs: 15_000,
    tickHeal: 5,
    tickIntervalMs: 3_000,
    incomingDamageMultiplier: 0.85,
    curedBy: ['sad'],
    visual: {
      auraColor: '#fbbf24',
      auraIntensity: 0.3,
      cardBorderColor: '#fbbf24',
    },
  },

  // ── Hungry ──
  hungry: {
    id: 'hungry',
    displayName: 'Hungry',
    icon: '🍖',
    defaultDurationMs: 25_000,
    damageMultiplier: 0.8,
    incomingDamageMultiplier: 1.2,
    visual: {
      modelTint: '#92400e',
      modelTintOpacity: 0.1,
      cardOverlayColor: 'rgba(146,64,14,0.08)',
    },
  },

  // ── Angry ──
  angry: {
    id: 'angry',
    displayName: 'Angry',
    icon: '😡',
    defaultDurationMs: 20_000,
    damageMultiplier: 1.5,
    incomingDamageMultiplier: 1.3,
    curedBy: ['happy', 'sleep'],
    visual: {
      modelTint: '#ef4444',
      modelTintOpacity: 0.18,
      auraColor: '#ef4444',
      auraIntensity: 0.35,
      cardBorderColor: '#ef4444',
    },
  },

  // ── Smelly ──
  smelly: {
    id: 'smelly',
    displayName: 'Smelly',
    icon: '🦨',
    defaultDurationMs: 18_000,
    accuracyPenalty: 0.15,
    incomingDamageMultiplier: 0.9,
    visual: {
      modelTint: '#84cc16',
      modelTintOpacity: 0.12,
      auraColor: '#a3e635',
      auraIntensity: 0.3,
      cardOverlayColor: 'rgba(163,230,53,0.08)',
    },
  },
};

// ── Helpers ────────────────────────────────────────────────

export function getBlueprint(id: string): StatusEffectBlueprint {
  const bp = STATUS_REGISTRY[id];
  if (!bp) throw new Error(`Unknown status effect: ${id}`);
  return bp;
}
