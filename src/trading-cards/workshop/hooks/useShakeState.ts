import { useState, useCallback } from 'react';
import type { ShakePattern } from '../../arena/descriptorTypes';
import { computeCardShake } from '../../engines/cardShakeEngine';
import { useAnimationLoop } from './useAnimationLoop';
import { SHAKE_DURATION } from '../constants';

export interface ShakeState {
  shakeTransform: string | undefined;
}

export interface ShakeActions {
  triggerShake: (pattern: ShakePattern) => void;
  setShakeTransform: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export function useShakeState(): [ShakeState, ShakeActions] {
  const [shakeTransform, setShakeTransform] = useState<string | undefined>();
  const anim = useAnimationLoop();

  const triggerShake = useCallback((pattern: ShakePattern) => {
    anim.start(
      SHAKE_DURATION,
      (elapsed) => {
        const result = computeCardShake(elapsed, { pattern, duration: SHAKE_DURATION, intensity: 1.5 });
        setShakeTransform(result.transform);
      },
      () => setShakeTransform(undefined),
    );
  }, [anim]);

  return [{ shakeTransform }, { triggerShake, setShakeTransform }];
}
