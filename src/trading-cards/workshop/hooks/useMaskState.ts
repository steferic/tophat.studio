import { useState, useCallback } from 'react';
import type { MaskConfig } from '../maskRegistry';
import { getDefaultMaskConfig } from '../maskRegistry';

export interface MaskActions {
  toggleMask: () => void;
  changeMaskParam: (key: string, value: any) => void;
  changeMaskPattern: (pattern: string) => void;
  changeZoneParam: (zone: 'zoneA' | 'zoneB', key: string, value: any) => void;
}

function migrateMaskConfig(raw: any): MaskConfig {
  const defaults = getDefaultMaskConfig();
  if (!raw) return defaults;
  // Migrate old single cellSize → cellSizeX/Y
  if ('cellSize' in raw && !('cellSizeX' in raw)) {
    raw.cellSizeX = raw.cellSize;
    raw.cellSizeY = raw.cellSize;
    raw.cellLinked = true;
    delete raw.cellSize;
  }
  return { ...defaults, ...raw };
}

export function useMaskState(): [MaskConfig, MaskActions] {
  const [maskConfig, setMaskConfig] = useState<MaskConfig>(() => migrateMaskConfig(getDefaultMaskConfig()));

  const toggleMask = useCallback(() => {
    setMaskConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const changeMaskParam = useCallback((key: string, value: any) => {
    setMaskConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const changeMaskPattern = useCallback((pattern: string) => {
    setMaskConfig((prev) => ({ ...prev, pattern }));
  }, []);

  const changeZoneParam = useCallback((zone: 'zoneA' | 'zoneB', key: string, value: any) => {
    setMaskConfig((prev) => ({
      ...prev,
      [zone]: { ...prev[zone], [key]: value },
    }));
  }, []);

  return [maskConfig, { toggleMask, changeMaskParam, changeMaskPattern, changeZoneParam }];
}
