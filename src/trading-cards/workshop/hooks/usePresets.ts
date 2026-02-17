import { useState, useCallback } from 'react';
import type { WorkshopPreset } from '../presetTypes';
import type { ToggleGroupState, ToggleGroupActions } from './useToggleGroup';
import type { GlowState, GlowActions } from './useGlowState';
import { getAllPresets, savePreset, deletePreset, exportPresetJSON } from '../presetStorage';

export interface PresetDeps {
  selectedModelId: string;
  filters: ToggleGroupState;
  filterActions: ToggleGroupActions;
  morphs: ToggleGroupState;
  morphActions: ToggleGroupActions;
  auras: ToggleGroupState;
  auraActions: ToggleGroupActions;
  shields: ToggleGroupState;
  shieldActions: ToggleGroupActions;
  sceneFx: ToggleGroupState;
  sceneFxActions: ToggleGroupActions;
  isDancing: boolean;
  isEvolved: boolean;
  setIsDancing: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEvolved: React.Dispatch<React.SetStateAction<boolean>>;
  glow: GlowState;
  glowActions: GlowActions;
}

export interface PresetState {
  presets: WorkshopPreset[];
}

export interface PresetActions {
  saveCurrentPreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  copyPresetJSON: (id: string) => void;
}

export function usePresets(deps: PresetDeps): [PresetState, PresetActions] {
  const [presets, setPresets] = useState<WorkshopPreset[]>(() => getAllPresets());

  const saveCurrentPreset = useCallback(
    (name: string) => {
      const preset: WorkshopPreset = {
        version: 1,
        id: crypto.randomUUID(),
        name,
        modelId: deps.selectedModelId,
        savedAt: Date.now(),
        config: {
          morphs: { active: deps.morphs.active, params: deps.morphs.params },
          auras: { active: deps.auras.active, params: deps.auras.params },
          shields: { active: deps.shields.active, params: deps.shields.params },
          sceneFx: { active: deps.sceneFx.active, params: deps.sceneFx.params },
          filters: { active: deps.filters.active, params: deps.filters.params },
          state: { evolved: deps.isEvolved, dancing: deps.isDancing },
          glow: { enabled: deps.glow.glowEnabled, color: deps.glow.glowColor, radius: deps.glow.glowRadius },
        },
      };
      savePreset(preset);
      setPresets(getAllPresets());
    },
    [deps.selectedModelId, deps.morphs, deps.auras, deps.shields, deps.sceneFx, deps.filters, deps.isEvolved, deps.isDancing, deps.glow],
  );

  const handleLoadPreset = useCallback(
    (id: string) => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) return;
      const { config } = preset;
      deps.morphActions.setActive(config.morphs.active);
      deps.morphActions.setParams(config.morphs.params);
      deps.auraActions.setActive(config.auras.active);
      deps.auraActions.setParams(config.auras.params);
      if (config.shields) {
        deps.shieldActions.setActive(config.shields.active);
        deps.shieldActions.setParams(config.shields.params);
      } else {
        deps.shieldActions.setActive([]);
        deps.shieldActions.setParams({});
      }
      if (config.sceneFx) {
        deps.sceneFxActions.setActive(config.sceneFx.active);
        deps.sceneFxActions.setParams(config.sceneFx.params);
      } else {
        deps.sceneFxActions.setActive([]);
        deps.sceneFxActions.setParams({});
      }
      deps.filterActions.setActive(config.filters.active);
      deps.filterActions.setParams(config.filters.params);
      deps.setIsEvolved(config.state.evolved);
      deps.setIsDancing(config.state.dancing);
      deps.glowActions.setGlowEnabled(config.glow.enabled);
      deps.glowActions.setGlowColor(config.glow.color);
      deps.glowActions.setGlowRadius(config.glow.radius);
    },
    [presets, deps.morphActions, deps.auraActions, deps.shieldActions, deps.sceneFxActions, deps.filterActions, deps.setIsEvolved, deps.setIsDancing, deps.glowActions],
  );

  const handleDeletePreset = useCallback((id: string) => {
    deletePreset(id);
    setPresets(getAllPresets());
  }, []);

  const handleCopyPresetJSON = useCallback((id: string) => {
    const json = exportPresetJSON(id);
    navigator.clipboard.writeText(json);
  }, []);

  return [
    { presets },
    {
      saveCurrentPreset,
      loadPreset: handleLoadPreset,
      deletePreset: handleDeletePreset,
      copyPresetJSON: handleCopyPresetJSON,
    },
  ];
}
