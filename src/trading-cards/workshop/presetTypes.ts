export interface PresetConfig {
  morphs: { active: string[]; params: Record<string, Record<string, any>> };
  auras: { active: string[]; params: Record<string, Record<string, any>> };
  shields?: { active: string[]; params: Record<string, Record<string, any>> };
  sceneFx?: { active: string[]; params: Record<string, Record<string, any>> };
  filters: { active: string[]; params: Record<string, Record<string, any>> };
  state: { evolved: boolean; dancing: boolean };
  glow: { enabled: boolean; color: string; radius: number };
}

export interface WorkshopPreset {
  version: 1;
  id: string;
  name: string;
  modelId: string;
  savedAt: number;
  config: PresetConfig;
}
