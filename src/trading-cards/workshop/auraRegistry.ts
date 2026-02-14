import type { ParamDef } from './filterRegistry';

export interface AuraDef {
  id: string;
  displayName: string;
  params: ParamDef[];
}

// ── Registry ────────────────────────────────────────────────

export const AURA_REGISTRY: AuraDef[] = [
  {
    id: 'ghost',
    displayName: 'Ghost',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#64b4ff' },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.15, min: 0.01, max: 0.6, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.25, min: 0.0, max: 2.0, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 1.0, min: 0, max: 5, step: 0.1 },
    ],
  },
  {
    id: 'flame',
    displayName: 'Flame',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#ff6600' },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.4, min: 0.01, max: 0.8, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.15, min: 0.0, max: 2.0, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 1.5, min: 0.1, max: 5, step: 0.1 },
      { key: 'intensity', label: 'Rise', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1 },
    ],
  },
  {
    id: 'electric',
    displayName: 'Electric',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#00e5ff' },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.35, min: 0.01, max: 0.8, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.1, min: 0.0, max: 2.0, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 3.0, min: 0.5, max: 10, step: 0.5 },
      { key: 'intensity', label: 'Spike', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1 },
    ],
  },
  {
    id: 'shadow',
    displayName: 'Shadow',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#1a0033' },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.5, min: 0.05, max: 0.9, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.2, min: 0.0, max: 2.0, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 0.5, min: 0, max: 3, step: 0.1 },
    ],
  },
  {
    id: 'prismatic',
    displayName: 'Prismatic',
    params: [
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.25, min: 0.01, max: 0.6, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.2, min: 0.0, max: 2.0, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1 },
    ],
  },
  {
    id: 'frost',
    displayName: 'Frost',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#b3e0ff' },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.25, min: 0.01, max: 0.6, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.15, min: 0.0, max: 2.0, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 0.8, min: 0, max: 3, step: 0.1 },
      { key: 'intensity', label: 'Crystals', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1 },
    ],
  },
  {
    id: 'void',
    displayName: 'Void',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#2d004d' },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.7, min: 0.1, max: 1.0, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.3, min: 0.05, max: 2.0, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 0.6, min: 0, max: 3, step: 0.1 },
    ],
  },
  {
    id: 'solar',
    displayName: 'Solar',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#ffaa00' },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.3, min: 0.01, max: 0.6, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'number', default: 0.4, min: 0.0, max: 3.0, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1 },
      { key: 'intensity', label: 'Flare', type: 'number', default: 1.0, min: 0.1, max: 5, step: 0.1 },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────

export const AURA_IDS: string[] = AURA_REGISTRY.map((a) => a.id);

const REGISTRY_MAP = new Map(AURA_REGISTRY.map((a) => [a.id, a]));

export function getAuraDef(id: string): AuraDef | undefined {
  return REGISTRY_MAP.get(id);
}

export function getAuraDefaults(id: string): Record<string, any> {
  const def = REGISTRY_MAP.get(id);
  if (!def) return {};
  const defaults: Record<string, any> = {};
  for (const p of def.params) {
    defaults[p.key] = p.default;
  }
  return defaults;
}
