import type { PresetConfig } from '../workshop/presetTypes';

export interface PlacedModel {
  instanceId: string;
  modelId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  presetId: string | null;
  presetConfig: PresetConfig | null;
}

export interface FloorSettings {
  gridSize: number;
  gridColor: string;
  gridOpacity: number;
  visible: boolean;
}

export interface WallSettings {
  wireColor: string;
  wireOpacity: number;
  visible: boolean;
}

// ── Sky ──────────────────────────────────────────────────────

export type SkyPreset = 'sunset' | 'noon' | 'night' | 'dawn' | 'custom';

export interface SkySettings {
  enabled: boolean;
  preset: SkyPreset;
  sunElevation: number;
  sunAzimuth: number;
  stars: boolean;
  starCount: number;
}

// ── Terrain ──────────────────────────────────────────────────

export type TerrainType = 'none' | 'grass' | 'desert' | 'snow' | 'rocky' | 'water';

export interface TerrainSettings {
  type: TerrainType;
  elevation: number;
  color: string;
  hideGrid: boolean;
}

export const TERRAIN_DEFAULT_COLORS: Record<TerrainType, string> = {
  none: '#4488ff',
  grass: '#4a8c3f',
  desert: '#c4a35a',
  snow: '#e8eef0',
  rocky: '#6b6b6b',
  water: '#1a5276',
};

// ── Water ────────────────────────────────────────────────────

export interface WaterSettings {
  enabled: boolean;
  height: number;
  color: string;
  opacity: number;
  waveAmplitude: number;
  waveSpeed: number;
}

// ── Weather ──────────────────────────────────────────────────

export type WeatherType = 'none' | 'snow' | 'rain';

export interface WeatherSettings {
  type: WeatherType;
  intensity: number;
  windX: number;
  color: string;
}

// ── Clouds ──────────────────────────────────────────────────

export interface CloudSettings {
  enabled: boolean;
  count: number;
  altitude: number;
  spread: number;
  opacity: number;
  speed: number;
  color: string;
  scale: number;
}

// ── God Rays ─────────────────────────────────────────────────

export interface GodRaysSettings {
  enabled: boolean;
  count: number;
  color: string;
  opacity: number;
  originY: number;
  speed: number;
}

// ── Config ───────────────────────────────────────────────────

export interface EnvironmentConfig {
  version: 2;
  id: string;
  name: string;
  savedAt: number;
  boxSize: number;
  boxHeight: number;
  floor: FloorSettings;
  walls: WallSettings;
  models: PlacedModel[];
  sky: SkySettings;
  terrain: TerrainSettings;
  water: WaterSettings;
  weather: WeatherSettings;
  clouds: CloudSettings;
  godRays: GodRaysSettings;
}

export const DEFAULT_BOX_SIZE = 156.25;
export const DEFAULT_BOX_HEIGHT = 78.125;

export const DEFAULT_FLOOR: FloorSettings = {
  gridSize: 25,
  gridColor: '#4488ff',
  gridOpacity: 0.3,
  visible: true,
};

export const DEFAULT_WALLS: WallSettings = {
  wireColor: '#4488ff',
  wireOpacity: 0.12,
  visible: true,
};

export const DEFAULT_SKY: SkySettings = {
  enabled: false,
  preset: 'sunset',
  sunElevation: 5,
  sunAzimuth: 270,
  stars: false,
  starCount: 1000,
};

export const DEFAULT_TERRAIN: TerrainSettings = {
  type: 'none',
  elevation: 0,
  color: TERRAIN_DEFAULT_COLORS.none,
  hideGrid: false,
};

export const DEFAULT_WATER: WaterSettings = {
  enabled: false,
  height: 2,
  color: '#1a6ea0',
  opacity: 0.6,
  waveAmplitude: 0.3,
  waveSpeed: 1.0,
};

export const DEFAULT_WEATHER: WeatherSettings = {
  type: 'none',
  intensity: 1.0,
  windX: 0,
  color: '#ffffff',
};

export const DEFAULT_CLOUDS: CloudSettings = {
  enabled: false,
  count: 8,
  altitude: 55,
  spread: 1.0,
  opacity: 0.7,
  speed: 1.0,
  color: '#ffffff',
  scale: 1.0,
};

export const DEFAULT_GOD_RAYS: GodRaysSettings = {
  enabled: false,
  count: 3,
  color: '#fff8e0',
  opacity: 0.15,
  originY: 70,
  speed: 1.0,
};

export function createPlacedModel(modelId: string): PlacedModel {
  return {
    instanceId: crypto.randomUUID(),
    modelId,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1.0,
    presetId: null,
    presetConfig: null,
  };
}
