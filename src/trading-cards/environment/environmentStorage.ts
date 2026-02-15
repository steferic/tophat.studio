import type { EnvironmentConfig } from './environmentTypes';
import {
  DEFAULT_SKY,
  DEFAULT_TERRAIN,
  DEFAULT_WATER,
  DEFAULT_WEATHER,
  DEFAULT_GOD_RAYS,
} from './environmentTypes';

const STORAGE_KEY = 'environment-configs';

function migrateConfig(raw: any): EnvironmentConfig {
  if (!raw.terrain) {
    return {
      ...raw,
      version: 2,
      sky: DEFAULT_SKY,
      terrain: DEFAULT_TERRAIN,
      water: DEFAULT_WATER,
      weather: DEFAULT_WEATHER,
      godRays: DEFAULT_GOD_RAYS,
    };
  }
  return raw;
}

export function getAllEnvironmentConfigs(): EnvironmentConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as any[]).map(migrateConfig);
  } catch {
    return [];
  }
}

export function saveEnvironmentConfig(config: EnvironmentConfig): void {
  const all = getAllEnvironmentConfigs();
  const idx = all.findIndex((c) => c.id === config.id);
  if (idx >= 0) {
    all[idx] = config;
  } else {
    all.push(config);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteEnvironmentConfig(id: string): void {
  const all = getAllEnvironmentConfigs().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function exportEnvironmentJSON(id: string): string {
  const config = getAllEnvironmentConfigs().find((c) => c.id === id);
  if (!config) return '{}';
  return JSON.stringify(config, null, 2);
}
