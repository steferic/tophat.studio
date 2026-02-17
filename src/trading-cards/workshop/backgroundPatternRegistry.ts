import type { ParamDef } from './filterRegistry';

export interface BgPatternDef {
  id: string;
  displayName: string;
  params: ParamDef[];
}

export interface BgPatternConfig {
  pattern: string;
  params: Record<string, any>;
}

// ── Shared params prepended to every pattern ─────────────────

const SHARED_PARAMS: ParamDef[] = [
  { key: 'color1', label: 'Color 1', type: 'color', default: '#000000' },
  { key: 'color2', label: 'Color 2', type: 'color', default: '#1a1a2e' },
  { key: 'speed', label: 'Speed', type: 'number', default: 0, min: 0, max: 5, step: 0.1 },
  { key: 'scale', label: 'Scale', type: 'number', default: 1, min: 0.1, max: 10, step: 0.1 },
];

function defWithShared(id: string, displayName: string, extra: ParamDef[] = []): BgPatternDef {
  return { id, displayName, params: [...SHARED_PARAMS, ...extra] };
}

// ── Registry ────────────────────────────────────────────────

export const BG_PATTERN_REGISTRY: BgPatternDef[] = [
  defWithShared('solid', 'Solid'),
  defWithShared('linear-gradient', 'Linear Gradient', [
    { key: 'angle', label: 'Angle', type: 'number', default: 0, min: 0, max: 360, step: 1 },
  ]),
  defWithShared('radial-gradient', 'Radial Gradient', [
    { key: 'centerX', label: 'Center X', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
    { key: 'centerY', label: 'Center Y', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
  ]),
  defWithShared('conic-gradient', 'Conic Gradient'),
  defWithShared('noise', 'Noise', [
    { key: 'octaves', label: 'Octaves', type: 'number', default: 4, min: 1, max: 6, step: 1 },
    { key: 'turbulence', label: 'Turbulence', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
  ]),
  defWithShared('grid', 'Grid', [
    { key: 'lineWidth', label: 'Line Width', type: 'number', default: 0.03, min: 0.01, max: 0.1, step: 0.005 },
  ]),
  defWithShared('dots', 'Dots', [
    { key: 'dotSize', label: 'Dot Size', type: 'number', default: 0.15, min: 0.01, max: 0.5, step: 0.01 },
  ]),
  defWithShared('concentric', 'Concentric', [
    { key: 'ringWidth', label: 'Ring Width', type: 'number', default: 0.08, min: 0.01, max: 0.2, step: 0.005 },
  ]),
  defWithShared('spiral', 'Spiral', [
    { key: 'arms', label: 'Arms', type: 'number', default: 4, min: 1, max: 12, step: 1 },
    { key: 'twist', label: 'Twist', type: 'number', default: 3, min: 0.5, max: 10, step: 0.1 },
  ]),
  defWithShared('starfield', 'Starfield', [
    { key: 'density', label: 'Density', type: 'number', default: 200, min: 50, max: 500, step: 10 },
    { key: 'twinkleSpeed', label: 'Twinkle Speed', type: 'number', default: 2, min: 0, max: 5, step: 0.1 },
  ]),
  defWithShared('voronoi', 'Voronoi', [
    { key: 'cellCount', label: 'Cell Count', type: 'number', default: 12, min: 4, max: 30, step: 1 },
  ]),
  defWithShared('waves', 'Waves', [
    { key: 'layers', label: 'Layers', type: 'number', default: 4, min: 2, max: 8, step: 1 },
    { key: 'amplitude', label: 'Amplitude', type: 'number', default: 0.1, min: 0.01, max: 0.3, step: 0.01 },
  ]),
  defWithShared('kaleidoscope', 'Kaleidoscope', [
    { key: 'segments', label: 'Segments', type: 'number', default: 6, min: 3, max: 16, step: 1 },
  ]),
  defWithShared('diamond-plate', 'Diamond Plate', [
    { key: 'borderWidth', label: 'Border Width', type: 'number', default: 0.04, min: 0.01, max: 0.1, step: 0.005 },
  ]),
];

// ── Helpers ─────────────────────────────────────────────────

export const BG_PATTERN_IDS: string[] = BG_PATTERN_REGISTRY.map((p) => p.id);

const REGISTRY_MAP = new Map(BG_PATTERN_REGISTRY.map((p) => [p.id, p]));

export function getBgPatternDef(id: string): BgPatternDef | undefined {
  return REGISTRY_MAP.get(id);
}

export function getBgPatternDefaults(id: string): Record<string, any> {
  const def = REGISTRY_MAP.get(id);
  if (!def) return {};
  const defaults: Record<string, any> = {};
  for (const p of def.params) {
    defaults[p.key] = p.default;
  }
  return defaults;
}

export const DEFAULT_BG_PATTERN: BgPatternConfig = {
  pattern: 'solid',
  params: getBgPatternDefaults('solid'),
};
