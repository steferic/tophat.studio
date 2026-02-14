import type { ParamDef } from './filterRegistry';

export interface MorphDef {
  id: string;
  displayName: string;
  params: ParamDef[];
}

// ── Registry ────────────────────────────────────────────────

export const MORPH_REGISTRY: MorphDef[] = [
  {
    id: 'bloat',
    displayName: 'Bloat',
    params: [
      { key: 'amount', label: 'Amount', type: 'number', default: 0.5, min: 0, max: 20, step: 0.1 },
      { key: 'noise', label: 'Noise', type: 'number', default: 0, min: 0, max: 10, step: 0.1 },
    ],
  },
  {
    id: 'starve',
    displayName: 'Starve',
    params: [
      { key: 'amount', label: 'Amount', type: 'number', default: 0.3, min: 0, max: 8, step: 0.1 },
    ],
  },
  {
    id: 'melt',
    displayName: 'Melt',
    params: [
      { key: 'amount', label: 'Amount', type: 'number', default: 0.5, min: 0, max: 20, step: 0.1 },
      { key: 'droop', label: 'Droop', type: 'number', default: 1.0, min: 0, max: 30, step: 0.5 },
    ],
  },
  {
    id: 'twist',
    displayName: 'Twist',
    params: [
      { key: 'angle', label: 'Angle', type: 'number', default: 1.57, min: -62.8, max: 62.8, step: 0.5 },
      {
        key: 'axis',
        label: 'Axis',
        type: 'select',
        default: 'y',
        options: [
          { label: 'X', value: 'x' },
          { label: 'Y', value: 'y' },
          { label: 'Z', value: 'z' },
        ],
      },
    ],
  },
  {
    id: 'stretch',
    displayName: 'Stretch',
    params: [
      { key: 'factor', label: 'Factor', type: 'number', default: 1.5, min: 0.2, max: 30.0, step: 0.25 },
    ],
  },
  {
    id: 'wobble',
    displayName: 'Wobble',
    params: [
      { key: 'amplitude', label: 'Amplitude', type: 'number', default: 0.3, min: 0, max: 15, step: 0.1 },
      { key: 'frequency', label: 'Frequency', type: 'number', default: 3.0, min: 0.5, max: 100, step: 1 },
    ],
  },
  {
    id: 'squash',
    displayName: 'Squash',
    params: [
      { key: 'amount', label: 'Amount', type: 'number', default: 0.5, min: 0, max: 10.0, step: 0.1 },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────

export const MORPH_IDS: string[] = MORPH_REGISTRY.map((m) => m.id);

const REGISTRY_MAP = new Map(MORPH_REGISTRY.map((m) => [m.id, m]));

export function getMorphDef(id: string): MorphDef | undefined {
  return REGISTRY_MAP.get(id);
}

export function getMorphDefaults(id: string): Record<string, any> {
  const def = REGISTRY_MAP.get(id);
  if (!def) return {};
  const defaults: Record<string, any> = {};
  for (const p of def.params) {
    defaults[p.key] = p.default;
  }
  return defaults;
}
