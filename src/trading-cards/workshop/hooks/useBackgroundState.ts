import { useState, useCallback } from 'react';
import type { BgPatternConfig } from '../backgroundPatternRegistry';
import { DEFAULT_BG_PATTERN, getBgPatternDefaults } from '../backgroundPatternRegistry';

export interface BgPatternState {
  bgPattern: BgPatternConfig;
}

export interface BgPatternActions {
  setPattern: (id: string) => void;
  setParam: (key: string, value: any) => void;
  setBgPattern: (config: BgPatternConfig) => void;
}

export function useBackgroundState(): [BgPatternState, BgPatternActions] {
  const [bgPattern, setBgPattern] = useState<BgPatternConfig>(DEFAULT_BG_PATTERN);

  const setPattern = useCallback((id: string) => {
    setBgPattern((prev) => {
      const defaults = getBgPatternDefaults(id);
      // Carry over shared params (color1, color2, speed, scale) from previous pattern
      return {
        pattern: id,
        params: {
          ...defaults,
          color1: prev.params.color1 ?? defaults.color1,
          color2: prev.params.color2 ?? defaults.color2,
          speed: prev.params.speed ?? defaults.speed,
          scale: prev.params.scale ?? defaults.scale,
        },
      };
    });
  }, []);

  const setParam = useCallback((key: string, value: any) => {
    setBgPattern((prev) => ({
      ...prev,
      params: { ...prev.params, [key]: value },
    }));
  }, []);

  return [
    { bgPattern },
    { setPattern, setParam, setBgPattern },
  ];
}
