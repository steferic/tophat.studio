import type { WorkshopPreset } from './presetTypes';

const STORAGE_KEY = 'workshop-presets';

export function getAllPresets(): WorkshopPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WorkshopPreset[];
  } catch {
    return [];
  }
}

export function getPresetsForModel(modelId: string): WorkshopPreset[] {
  return getAllPresets().filter((p) => p.modelId === modelId);
}

export function savePreset(preset: WorkshopPreset): void {
  const all = getAllPresets();
  all.push(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deletePreset(id: string): void {
  const all = getAllPresets().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function exportPresetJSON(id: string): string {
  const preset = getAllPresets().find((p) => p.id === id);
  if (!preset) return '{}';
  return JSON.stringify(preset, null, 2);
}
