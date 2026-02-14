export type ParamType = 'number' | 'boolean' | 'select' | 'color';

export interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  default: number | boolean | string;
  // number
  min?: number;
  max?: number;
  step?: number;
  // select
  options?: { label: string; value: string | number }[];
}

export interface FilterDef {
  id: string;
  displayName: string;
  category: 'library' | 'custom';
  params: ParamDef[];
}

// ── Registry ────────────────────────────────────────────────

export const FILTER_REGISTRY: FilterDef[] = [
  // ── Existing library effects ────────────────────────────
  {
    id: 'blue-tint',
    displayName: 'Blue Tint',
    category: 'library',
    params: [],
  },
  {
    id: 'bloom',
    displayName: 'Bloom',
    category: 'library',
    params: [
      { key: 'intensity', label: 'Intensity', type: 'number', default: 2.0, min: 0, max: 10, step: 0.1 },
      { key: 'luminanceThreshold', label: 'Luma Threshold', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01 },
      { key: 'luminanceSmoothing', label: 'Luma Smoothing', type: 'number', default: 0.9, min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    id: 'chromatic-aberration',
    displayName: 'Chromatic Aberration',
    category: 'library',
    params: [
      { key: 'offsetX', label: 'Offset X', type: 'number', default: 0.006, min: 0, max: 0.05, step: 0.001 },
      { key: 'offsetY', label: 'Offset Y', type: 'number', default: 0.006, min: 0, max: 0.05, step: 0.001 },
      { key: 'radialModulation', label: 'Radial Mod', type: 'boolean', default: false },
    ],
  },
  {
    id: 'noise',
    displayName: 'Noise',
    category: 'library',
    params: [
      { key: 'premultiply', label: 'Premultiply', type: 'boolean', default: true },
    ],
  },
  {
    id: 'vignette',
    displayName: 'Vignette',
    category: 'library',
    params: [
      { key: 'darkness', label: 'Darkness', type: 'number', default: 0.7, min: 0, max: 1, step: 0.05 },
      { key: 'offset', label: 'Offset', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'glitch',
    displayName: 'Glitch',
    category: 'library',
    params: [
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        default: 'SPORADIC',
        options: [
          { label: 'Sporadic', value: 'SPORADIC' },
          { label: 'Constant Mild', value: 'CONSTANT_MILD' },
          { label: 'Constant Wild', value: 'CONSTANT_WILD' },
        ],
      },
    ],
  },
  {
    id: 'dot-screen',
    displayName: 'Dot Screen',
    category: 'library',
    params: [
      { key: 'angle', label: 'Angle', type: 'number', default: 0.785, min: 0, max: 6.28, step: 0.05 },
      { key: 'scale', label: 'Scale', type: 'number', default: 1.2, min: 0.1, max: 5, step: 0.1 },
    ],
  },
  {
    id: 'sepia',
    displayName: 'Sepia',
    category: 'library',
    params: [
      { key: 'intensity', label: 'Intensity', type: 'number', default: 0.85, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'grayscale',
    displayName: 'Grayscale',
    category: 'library',
    params: [],
  },
  {
    id: 'hue-shift',
    displayName: 'Hue Shift',
    category: 'library',
    params: [
      { key: 'hue', label: 'Hue', type: 'number', default: 3.14, min: 0, max: 6.28, step: 0.05 },
      { key: 'saturation', label: 'Saturation', type: 'number', default: 0.15, min: -1, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'pixelation',
    displayName: 'Pixelation',
    category: 'library',
    params: [
      { key: 'granularity', label: 'Granularity', type: 'number', default: 6, min: 1, max: 40, step: 1 },
    ],
  },
  {
    id: 'scanline',
    displayName: 'Scanline',
    category: 'library',
    params: [
      { key: 'density', label: 'Density', type: 'number', default: 1.8, min: 0.1, max: 5, step: 0.1 },
    ],
  },

  // ── New library effects ─────────────────────────────────
  {
    id: 'ascii',
    displayName: 'ASCII',
    category: 'library',
    params: [
      { key: 'fontSize', label: 'Font Size', type: 'number', default: 64, min: 8, max: 128, step: 4 },
      { key: 'cellSize', label: 'Cell Size', type: 'number', default: 16, min: 4, max: 64, step: 2 },
      { key: 'color', label: 'Color', type: 'color', default: '#00ff00' },
      { key: 'invert', label: 'Invert', type: 'boolean', default: false },
    ],
  },
  {
    id: 'brightness-contrast',
    displayName: 'Brightness / Contrast',
    category: 'library',
    params: [
      { key: 'brightness', label: 'Brightness', type: 'number', default: 0, min: -1, max: 1, step: 0.05 },
      { key: 'contrast', label: 'Contrast', type: 'number', default: 0, min: -1, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'color-depth',
    displayName: 'Color Depth',
    category: 'library',
    params: [
      { key: 'bits', label: 'Bits', type: 'number', default: 8, min: 1, max: 24, step: 1 },
    ],
  },
  {
    id: 'depth',
    displayName: 'Depth',
    category: 'library',
    params: [
      { key: 'inverted', label: 'Inverted', type: 'boolean', default: false },
    ],
  },
  {
    id: 'depth-of-field',
    displayName: 'Depth of Field',
    category: 'library',
    params: [
      { key: 'focusDistance', label: 'Focus Distance', type: 'number', default: 0.02, min: 0, max: 1, step: 0.005 },
      { key: 'focalLength', label: 'Focal Length', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'bokehScale', label: 'Bokeh Scale', type: 'number', default: 3, min: 0, max: 10, step: 0.5 },
    ],
  },
  {
    id: 'grid',
    displayName: 'Grid',
    category: 'library',
    params: [
      { key: 'scale', label: 'Scale', type: 'number', default: 1, min: 0.1, max: 10, step: 0.1 },
      { key: 'lineWidth', label: 'Line Width', type: 'number', default: 0.5, min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    id: 'n8ao',
    displayName: 'N8AO',
    category: 'library',
    params: [
      { key: 'aoRadius', label: 'AO Radius', type: 'number', default: 5, min: 0.1, max: 20, step: 0.5 },
      { key: 'distanceFalloff', label: 'Distance Falloff', type: 'number', default: 1, min: 0, max: 10, step: 0.5 },
      { key: 'intensity', label: 'Intensity', type: 'number', default: 5, min: 0, max: 20, step: 0.5 },
      {
        key: 'quality',
        label: 'Quality',
        type: 'select',
        default: 'medium',
        options: [
          { label: 'Performance', value: 'performance' },
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
          { label: 'Ultra', value: 'ultra' },
        ],
      },
    ],
  },
  {
    id: 'ramp',
    displayName: 'Ramp',
    category: 'library',
    params: [
      {
        key: 'rampType',
        label: 'Type',
        type: 'select',
        default: 0,
        options: [
          { label: 'Linear', value: 0 },
          { label: 'Radial', value: 1 },
          { label: 'Mirrored', value: 2 },
        ],
      },
      { key: 'rampBias', label: 'Bias', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'rampGain', label: 'Gain', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'rampMask', label: 'Mask', type: 'boolean', default: false },
      { key: 'rampInvert', label: 'Invert', type: 'boolean', default: false },
    ],
  },
  {
    id: 'tilt-shift',
    displayName: 'Tilt Shift',
    category: 'library',
    params: [
      { key: 'offset', label: 'Offset', type: 'number', default: 0, min: -1, max: 1, step: 0.05 },
      { key: 'rotation', label: 'Rotation', type: 'number', default: 0, min: 0, max: 6.28, step: 0.1 },
      { key: 'focusArea', label: 'Focus Area', type: 'number', default: 0.4, min: 0, max: 1, step: 0.05 },
      { key: 'feather', label: 'Feather', type: 'number', default: 0.3, min: 0, max: 1, step: 0.05 },
    ],
  },
  {
    id: 'tilt-shift-2',
    displayName: 'Tilt Shift 2',
    category: 'library',
    params: [
      { key: 'blur', label: 'Blur', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'taper', label: 'Taper', type: 'number', default: 0.5, min: 0, max: 1, step: 0.05 },
      { key: 'samples', label: 'Samples', type: 'number', default: 6, min: 1, max: 32, step: 1 },
    ],
  },
  {
    id: 'tone-mapping',
    displayName: 'Tone Mapping',
    category: 'library',
    params: [
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        default: 7,
        options: [
          { label: 'Linear', value: 0 },
          { label: 'Reinhard', value: 1 },
          { label: 'Reinhard 2', value: 2 },
          { label: 'Reinhard 2 Adaptive', value: 3 },
          { label: 'Uncharted 2', value: 4 },
          { label: 'Optimized Cineon', value: 5 },
          { label: 'Cineon', value: 6 },
          { label: 'ACES Filmic', value: 7 },
          { label: 'AGX', value: 8 },
          { label: 'Neutral', value: 9 },
        ],
      },
    ],
  },
  {
    id: 'water',
    displayName: 'Water',
    category: 'library',
    params: [
      { key: 'factor', label: 'Factor', type: 'number', default: 0.5, min: 0, max: 2, step: 0.05 },
    ],
  },

  // ── Existing custom effects ─────────────────────────────
  {
    id: 'dither',
    displayName: 'Dither',
    category: 'custom',
    params: [
      { key: 'pixelSize', label: 'Pixel Size', type: 'number', default: 3.0, min: 1, max: 12, step: 0.5 },
    ],
  },
  {
    id: 'posterize',
    displayName: 'Posterize',
    category: 'custom',
    params: [
      { key: 'levels', label: 'Levels', type: 'number', default: 5.0, min: 2, max: 16, step: 1 },
    ],
  },
  {
    id: 'duotone',
    displayName: 'Duotone',
    category: 'custom',
    params: [
      { key: 'colorA', label: 'Color A', type: 'color', default: '#00cce6' },
      { key: 'colorB', label: 'Color B', type: 'color', default: '#e61a99' },
    ],
  },
  { id: 'night-vision', displayName: 'Night Vision', category: 'custom', params: [] },
  { id: 'thermal', displayName: 'Thermal', category: 'custom', params: [] },
  { id: 'crt', displayName: 'CRT', category: 'custom', params: [] },
  { id: 'vhs', displayName: 'VHS', category: 'custom', params: [] },
  { id: 'invert', displayName: 'Invert', category: 'custom', params: [] },
  { id: 'edge-detect', displayName: 'Edge Detect', category: 'custom', params: [] },
  { id: 'underwater', displayName: 'Underwater', category: 'custom', params: [] },
  { id: 'hologram', displayName: 'Hologram', category: 'custom', params: [] },
  { id: 'kaleidoscope', displayName: 'Kaleidoscope', category: 'custom', params: [] },
  { id: 'retro-lcd', displayName: 'Retro LCD', category: 'custom', params: [] },
  { id: 'emboss', displayName: 'Emboss', category: 'custom', params: [] },
  { id: 'ripple', displayName: 'Ripple', category: 'custom', params: [] },
];

// ── Helpers ─────────────────────────────────────────────────

export const FILTER_IDS: string[] = FILTER_REGISTRY.map((f) => f.id);

const REGISTRY_MAP = new Map(FILTER_REGISTRY.map((f) => [f.id, f]));

export function getFilterDef(id: string): FilterDef | undefined {
  return REGISTRY_MAP.get(id);
}

export function getFilterDefaults(id: string): Record<string, any> {
  const def = REGISTRY_MAP.get(id);
  if (!def) return {};
  const defaults: Record<string, any> = {};
  for (const p of def.params) {
    defaults[p.key] = p.default;
  }
  return defaults;
}
