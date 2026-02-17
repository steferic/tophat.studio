import { useState, useCallback, useEffect } from 'react';
import type { CameraPreset, CameraMovementDescriptor } from '../../arena/descriptorTypes';
import { CAMERA_CLEAR_TIMEOUT } from '../constants';

export interface CameraState {
  derivedCameraDesc: CameraMovementDescriptor | null;
}

export interface CameraActions {
  triggerCamera: (preset: CameraPreset) => void;
}

export function useCameraState(): [CameraState, CameraActions] {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset | null>(null);
  const [cameraTrigger, setCameraTrigger] = useState(0);
  const [derivedCameraDesc, setDerivedCameraDesc] = useState<CameraMovementDescriptor | null>(null);

  const triggerCamera = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    setCameraTrigger((c) => c + 1);
  }, []);

  // Derive a unique CameraMovementDescriptor per trigger
  useEffect(() => {
    if (cameraPreset) {
      setDerivedCameraDesc({ preset: cameraPreset, intensity: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraTrigger]);

  // Clear camera descriptor after it's consumed
  useEffect(() => {
    if (!derivedCameraDesc) return;
    const timer = setTimeout(() => setDerivedCameraDesc(null), CAMERA_CLEAR_TIMEOUT * 1000);
    return () => clearTimeout(timer);
  }, [derivedCameraDesc]);

  return [{ derivedCameraDesc }, { triggerCamera }];
}
