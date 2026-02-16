import type { ParamDef } from './filterRegistry';

// ── Mask Pattern Definitions ─────────────────────────────────

export interface MaskPatternDef {
  id: string;
  displayName: string;
}

export const MASK_PATTERNS: MaskPatternDef[] = [
  { id: 'checkerboard', displayName: 'Checkerboard' },
  { id: 'vertical-stripes', displayName: 'Vertical Stripes' },
  { id: 'horizontal-stripes', displayName: 'Horizontal Stripes' },
  { id: 'hexagonal', displayName: 'Hexagonal' },
  { id: 'radial-sectors', displayName: 'Radial Sectors' },
  { id: 'diamond', displayName: 'Diamond' },
  { id: 'wave', displayName: 'Wave' },
  { id: 'diagonal-stripes', displayName: 'Diagonal Stripes' },
];

// ── Global Mask Params ───────────────────────────────────────

export const MASK_GLOBAL_PARAMS: ParamDef[] = [
  { key: 'cellSize', label: 'Cell Size', type: 'number', default: 0.1, min: 0.01, max: 0.5, step: 0.01 },
  { key: 'speed', label: 'Speed', type: 'number', default: 0, min: 0, max: 10, step: 0.1 },
  { key: 'softness', label: 'Softness', type: 'number', default: 0, min: 0, max: 0.1, step: 0.001 },
  { key: 'invertZones', label: 'Invert Zones', type: 'boolean', default: false },
];

// ── Per-Zone Effect Params ───────────────────────────────────

export const ZONE_EFFECT_PARAMS: ParamDef[] = [
  { key: 'grayscale', label: 'Grayscale', type: 'number', default: 0, min: 0, max: 1, step: 0.05 },
  { key: 'sepia', label: 'Sepia', type: 'number', default: 0, min: 0, max: 1, step: 0.05 },
  { key: 'invert', label: 'Invert', type: 'number', default: 0, min: 0, max: 1, step: 0.05 },
  { key: 'hueRotation', label: 'Hue Rotation', type: 'number', default: 0, min: 0, max: 6.28, step: 0.05 },
  { key: 'saturation', label: 'Saturation', type: 'number', default: 1, min: 0, max: 3, step: 0.05 },
  { key: 'brightness', label: 'Brightness', type: 'number', default: 1, min: 0, max: 3, step: 0.05 },
  { key: 'contrast', label: 'Contrast', type: 'number', default: 1, min: 0, max: 3, step: 0.05 },
  { key: 'posterize', label: 'Posterize', type: 'number', default: 0, min: 0, max: 16, step: 1 },
  { key: 'tintColor', label: 'Tint Color', type: 'color', default: '#ffffff' },
  { key: 'tintAmount', label: 'Tint Amount', type: 'number', default: 0, min: 0, max: 1, step: 0.05 },
];

// ── Config Interfaces ────────────────────────────────────────

export interface ZoneConfig {
  grayscale: number;
  sepia: number;
  invert: number;
  hueRotation: number;
  saturation: number;
  brightness: number;
  contrast: number;
  posterize: number;
  tintColor: string;
  tintAmount: number;
}

export interface MaskConfig {
  enabled: boolean;
  pattern: string;
  cellSize: number;
  speed: number;
  softness: number;
  invertZones: boolean;
  zoneA: ZoneConfig;
  zoneB: ZoneConfig;
}

// ── Defaults ─────────────────────────────────────────────────

export function getDefaultZoneConfig(): ZoneConfig {
  return {
    grayscale: 0,
    sepia: 0,
    invert: 0,
    hueRotation: 0,
    saturation: 1,
    brightness: 1,
    contrast: 1,
    posterize: 0,
    tintColor: '#ffffff',
    tintAmount: 0,
  };
}

export function getDefaultMaskConfig(): MaskConfig {
  return {
    enabled: false,
    pattern: 'checkerboard',
    cellSize: 0.1,
    speed: 0,
    softness: 0,
    invertZones: false,
    zoneA: getDefaultZoneConfig(),
    zoneB: getDefaultZoneConfig(),
  };
}
