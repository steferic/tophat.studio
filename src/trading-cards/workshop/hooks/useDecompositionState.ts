import { useState, useCallback } from 'react';
import { useAnimationLoop } from './useAnimationLoop';
import { DECOMPOSITION_DURATION } from '../constants';

export interface DecompositionState {
  activeDecomposition: string | null;
  decompositionProgress: number;
}

export interface DecompositionActions {
  toggleDecomposition: (type: string) => void;
  reset: () => void;
}

export function useDecompositionState(): [DecompositionState, DecompositionActions] {
  const [activeDecomposition, setActiveDecomposition] = useState<string | null>(null);
  const [decompositionProgress, setDecompositionProgress] = useState(0);
  const anim = useAnimationLoop();

  const reset = useCallback(() => {
    anim.cancel();
    setActiveDecomposition(null);
    setDecompositionProgress(0);
  }, [anim]);

  const toggleDecomposition = useCallback(
    (type: string) => {
      anim.cancel();

      if (activeDecomposition === type) {
        setActiveDecomposition(null);
        setDecompositionProgress(0);
        return;
      }

      setActiveDecomposition(type);
      setDecompositionProgress(0);

      anim.start(
        DECOMPOSITION_DURATION,
        (elapsed) => setDecompositionProgress(Math.min(elapsed / DECOMPOSITION_DURATION, 1.0)),
        () => setDecompositionProgress(1.0),
      );
    },
    [activeDecomposition, anim],
  );

  return [
    { activeDecomposition, decompositionProgress },
    { toggleDecomposition, reset },
  ];
}
