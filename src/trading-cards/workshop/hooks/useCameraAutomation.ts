import { useState, useCallback } from 'react';

export interface OrbitAutoParams { enabled: boolean; speed: number }
export interface BreatheParams { enabled: boolean; amplitude: number; speed: number }
export interface VertigoParams { enabled: boolean; speed: number; intensity: number }
export interface DriftParams { enabled: boolean; intensity: number; speed: number }
export interface EpicycleParams { enabled: boolean; speed: number; complexity: number; radius: number; verticalAmp: number }

export interface CameraAutomationState {
  orbit: OrbitAutoParams;
  breathe: BreatheParams;
  vertigo: VertigoParams;
  drift: DriftParams;
  epicycle: EpicycleParams;
}

export const DEFAULT_CAMERA_AUTOMATION: CameraAutomationState = {
  orbit: { enabled: false, speed: 1.0 },
  breathe: { enabled: false, amplitude: 0.3, speed: 0.5 },
  vertigo: { enabled: false, speed: 0.4, intensity: 0.5 },
  drift: { enabled: false, intensity: 0.5, speed: 0.5 },
  epicycle: { enabled: false, speed: 0.3, complexity: 3, radius: 1.0, verticalAmp: 0.3 },
};

export interface CameraAutomationActions {
  toggle: (key: keyof CameraAutomationState) => void;
  setParam: (key: keyof CameraAutomationState, param: string, value: number) => void;
}

export function useCameraAutomation(): [CameraAutomationState, CameraAutomationActions] {
  const [state, setState] = useState<CameraAutomationState>(DEFAULT_CAMERA_AUTOMATION);

  const toggle = useCallback((key: keyof CameraAutomationState) => {
    setState((s) => ({ ...s, [key]: { ...s[key], enabled: !s[key].enabled } }));
  }, []);

  const setParam = useCallback((key: keyof CameraAutomationState, param: string, value: number) => {
    setState((s) => ({ ...s, [key]: { ...s[key], [param]: value } }));
  }, []);

  return [state, { toggle, setParam }];
}
