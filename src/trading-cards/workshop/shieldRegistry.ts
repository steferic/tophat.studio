import type { ParamDef } from './filterRegistry';

export interface ShieldDef {
  id: string;
  displayName: string;
  params: ParamDef[];
}

// ── Common params shared by all shields ─────────────────────

const COMMON_PARAMS: ParamDef[] = [
  { key: 'color', label: 'Color', type: 'color', default: '#fbbf24' },
  { key: 'opacity', label: 'Opacity', type: 'number', default: 0.7, min: 0.01, max: 1.0, step: 0.01 },
  { key: 'radius', label: 'Radius', type: 'number', default: 0.55, min: 0.1, max: 3.0, step: 0.05 },
  {
    key: 'renderMode',
    label: 'Mode',
    type: 'select',
    default: 'particles',
    options: [
      { label: 'Particles', value: 'particles' },
      { label: 'Planes', value: 'planes' },
    ],
  },
  { key: 'particleCount', label: 'Particles', type: 'number', default: 4000, min: 100, max: 20000, step: 100 },
  { key: 'particleSize', label: 'Particle Size', type: 'number', default: 0.4, min: 0.05, max: 2.0, step: 0.05 },
  { key: 'rotationSpeed', label: 'Rotation', type: 'number', default: 0.3, min: 0, max: 5, step: 0.1 },
  { key: 'pulseSpeed', label: 'Pulse Speed', type: 'number', default: 0, min: 0, max: 5, step: 0.1 },
  { key: 'pulseAmount', label: 'Pulse Amount', type: 'number', default: 0.05, min: 0, max: 0.5, step: 0.01 },
  { key: 'wireframe', label: 'Wireframe', type: 'boolean', default: false },
];

// ── Registry ────────────────────────────────────────────────

export const SHIELD_REGISTRY: ShieldDef[] = [
  { id: 'sphere', displayName: 'Sphere', params: COMMON_PARAMS },
  { id: 'cube', displayName: 'Cube', params: COMMON_PARAMS },
  { id: 'octahedron', displayName: 'Octahedron', params: COMMON_PARAMS },
  { id: 'icosahedron', displayName: 'Icosahedron', params: COMMON_PARAMS },
  { id: 'dodecahedron', displayName: 'Dodecahedron', params: COMMON_PARAMS },
  { id: 'cylinder', displayName: 'Cylinder', params: COMMON_PARAMS },
  { id: 'torus', displayName: 'Torus', params: COMMON_PARAMS },
  { id: 'pyramid', displayName: 'Pyramid', params: COMMON_PARAMS },
];

// ── Helpers ─────────────────────────────────────────────────

export const SHIELD_IDS: string[] = SHIELD_REGISTRY.map((s) => s.id);

const REGISTRY_MAP = new Map(SHIELD_REGISTRY.map((s) => [s.id, s]));

export function getShieldDef(id: string): ShieldDef | undefined {
  return REGISTRY_MAP.get(id);
}

export function getShieldDefaults(id: string): Record<string, any> {
  const def = REGISTRY_MAP.get(id);
  if (!def) return {};
  const defaults: Record<string, any> = {};
  for (const p of def.params) {
    defaults[p.key] = p.default;
  }
  return defaults;
}
