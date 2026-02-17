import { useCallback, useRef } from 'react';

/**
 * Shared RAF animation loop hook.
 * Encapsulates the start/cancel/cleanup pattern used by shake, decomposition,
 * and attack preview hooks.
 */
export function useAnimationLoop() {
  const rafRef = useRef(0);

  const cancel = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  const start = useCallback(
    (
      durationSec: number,
      onFrame: (elapsedSec: number) => void,
      onComplete?: () => void,
    ) => {
      cancelAnimationFrame(rafRef.current);
      const startTime = performance.now();
      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        if (elapsed >= durationSec) {
          onComplete?.();
          return;
        }
        onFrame(elapsed);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    },
    [],
  );

  return { start, cancel };
}
