import type { ParamDef } from './filterRegistry';

export interface SceneFxDef {
  id: string;
  displayName: string;
  params: ParamDef[];
}

// ── Registry ────────────────────────────────────────────────

export const SCENE_FX_REGISTRY: SceneFxDef[] = [
  {
    id: 'magic-circle',
    displayName: 'Magic Circle',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#9966ff' },
      { key: 'radius', label: 'Radius', type: 'number', default: 1.5, min: 0.5, max: 4, step: 0.1 },
      { key: 'rotationSpeed', label: 'Rotation Speed', type: 'number', default: 1.0, min: 0, max: 5, step: 0.1 },
      { key: 'ringCount', label: 'Ring Count', type: 'number', default: 3, min: 1, max: 6, step: 1 },
      { key: 'pulseIntensity', label: 'Pulse', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'glyphDensity', label: 'Glyph Density', type: 'number', default: 8, min: 4, max: 16, step: 1 },
    ],
  },
  {
    id: 'portal',
    displayName: 'Portal',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#00ccff' },
      { key: 'size', label: 'Size', type: 'number', default: 2.0, min: 0.5, max: 5, step: 0.1 },
      { key: 'swirlSpeed', label: 'Swirl Speed', type: 'number', default: 1.0, min: 0, max: 5, step: 0.1 },
      { key: 'distortion', label: 'Distortion', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.8, min: 0.1, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'lightning',
    displayName: 'Lightning Arcs',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#aaddff' },
      { key: 'arcCount', label: 'Arc Count', type: 'number', default: 3, min: 1, max: 8, step: 1 },
      { key: 'intensity', label: 'Intensity', type: 'number', default: 1.0, min: 0.1, max: 2, step: 0.1 },
      { key: 'chaos', label: 'Chaos', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'range', label: 'Range', type: 'number', default: 2.0, min: 0.5, max: 5, step: 0.1 },
    ],
  },
  {
    id: 'aurora',
    displayName: 'Aurora Borealis',
    params: [
      { key: 'color1', label: 'Color 1', type: 'color', default: '#00ff88' },
      { key: 'color2', label: 'Color 2', type: 'color', default: '#8844ff' },
      { key: 'speed', label: 'Speed', type: 'number', default: 0.5, min: 0.1, max: 3, step: 0.1 },
      { key: 'height', label: 'Height', type: 'number', default: 15, min: 5, max: 30, step: 1 },
      { key: 'spread', label: 'Spread', type: 'number', default: 20, min: 5, max: 40, step: 1 },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.6, min: 0.1, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'lava-pool',
    displayName: 'Lava Pool',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#ff4400' },
      { key: 'radius', label: 'Radius', type: 'number', default: 1.5, min: 0.5, max: 4, step: 0.1 },
      { key: 'flowSpeed', label: 'Flow Speed', type: 'number', default: 1.0, min: 0, max: 5, step: 0.1 },
      { key: 'crackIntensity', label: 'Crack Intensity', type: 'number', default: 0.7, min: 0, max: 1, step: 0.05 },
      { key: 'heatGlow', label: 'Heat Glow', type: 'number', default: 0.8, min: 0, max: 1, step: 0.05 },
      { key: 'turbulence', label: 'Turbulence', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'fluid-vortex',
    displayName: 'Fluid Vortex',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#00aaff' },
      { key: 'height', label: 'Height', type: 'number', default: 3.0, min: 1, max: 8, step: 0.1 },
      { key: 'radius', label: 'Radius', type: 'number', default: 1.0, min: 0.3, max: 3, step: 0.1 },
      { key: 'speed', label: 'Speed', type: 'number', default: 1.0, min: 0, max: 5, step: 0.1 },
      { key: 'twist', label: 'Twist', type: 'number', default: 2.0, min: 0, max: 6, step: 0.1 },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.6, min: 0.1, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'liquid-orbs',
    displayName: 'Liquid Orbs',
    params: [
      { key: 'color', label: 'Color', type: 'color', default: '#66ffcc' },
      { key: 'orbCount', label: 'Orb Count', type: 'number', default: 5, min: 2, max: 12, step: 1 },
      { key: 'orbSize', label: 'Orb Size', type: 'number', default: 0.3, min: 0.1, max: 1, step: 0.05 },
      { key: 'orbitRadius', label: 'Orbit Radius', type: 'number', default: 1.5, min: 0.5, max: 4, step: 0.1 },
      { key: 'speed', label: 'Speed', type: 'number', default: 1.0, min: 0, max: 5, step: 0.1 },
      { key: 'wobble', label: 'Wobble', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'plasma-field',
    displayName: 'Plasma Field',
    params: [
      { key: 'color1', label: 'Color 1', type: 'color', default: '#ff00ff' },
      { key: 'color2', label: 'Color 2', type: 'color', default: '#00ffff' },
      { key: 'intensity', label: 'Intensity', type: 'number', default: 0.7, min: 0.1, max: 1.5, step: 0.05 },
      { key: 'speed', label: 'Speed', type: 'number', default: 0.8, min: 0, max: 3, step: 0.1 },
      { key: 'scale', label: 'Scale', type: 'number', default: 1.5, min: 0.5, max: 5, step: 0.1 },
      { key: 'opacity', label: 'Opacity', type: 'number', default: 0.5, min: 0.1, max: 1, step: 0.05 },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────

export const SCENE_FX_IDS: string[] = SCENE_FX_REGISTRY.map((f) => f.id);

const REGISTRY_MAP = new Map(SCENE_FX_REGISTRY.map((f) => [f.id, f]));

export function getSceneFxDef(id: string): SceneFxDef | undefined {
  return REGISTRY_MAP.get(id);
}

export function getSceneFxDefaults(id: string): Record<string, any> {
  const def = REGISTRY_MAP.get(id);
  if (!def) return {};
  const defaults: Record<string, any> = {};
  for (const p of def.params) {
    defaults[p.key] = p.default;
  }
  return defaults;
}
