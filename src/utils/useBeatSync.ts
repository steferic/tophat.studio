import { useEffect, useState } from 'react';
import { useVideoConfig } from 'remotion';
import { detectBeats, BeatMap, BeatDetectionOptions } from './beatDetection';

interface UseBeatSyncResult {
  beatMap: BeatMap | null;
  loading: boolean;
  error: Error | null;
}

/**
 * React hook for beat detection in Remotion components
 *
 * Usage:
 * ```tsx
 * const { beatMap, loading } = useBeatSync(staticFile('audio/track.mp3'));
 *
 * if (loading || !beatMap) return null;
 *
 * // Use beatMap.frames to get beat frame numbers
 * // Use beatMap.nearestBeat(frame) to snap to nearest beat
 * ```
 */
export function useBeatSync(
  audioUrl: string,
  options?: BeatDetectionOptions
): UseBeatSyncResult {
  const { fps } = useVideoConfig();
  const [beatMap, setBeatMap] = useState<BeatMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      try {
        setLoading(true);
        setError(null);
        const result = await detectBeats(audioUrl, fps, options);
        if (!cancelled) {
          setBeatMap(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    analyze();

    return () => {
      cancelled = true;
    };
  }, [audioUrl, fps, options?.threshold, options?.minBeatInterval]);

  return { beatMap, loading, error };
}

/**
 * Simple hook to check if current frame is on a beat
 * Useful for triggering animations on beats
 */
export function useIsOnBeat(
  beatMap: BeatMap | null,
  currentFrame: number,
  tolerance: number = 2
): boolean {
  if (!beatMap) return false;

  return beatMap.frames.some(
    (beatFrame) => Math.abs(currentFrame - beatFrame) <= tolerance
  );
}

/**
 * Get the progress to the next beat (0-1)
 * Useful for anticipation animations
 */
export function useBeatProgress(
  beatMap: BeatMap | null,
  currentFrame: number
): { progress: number; nextBeat: number | null; prevBeat: number | null } {
  if (!beatMap || beatMap.frames.length === 0) {
    return { progress: 0, nextBeat: null, prevBeat: null };
  }

  let prevBeat: number | null = null;
  let nextBeat: number | null = null;

  for (let i = 0; i < beatMap.frames.length; i++) {
    if (beatMap.frames[i] <= currentFrame) {
      prevBeat = beatMap.frames[i];
    }
    if (beatMap.frames[i] > currentFrame && nextBeat === null) {
      nextBeat = beatMap.frames[i];
      break;
    }
  }

  if (prevBeat === null || nextBeat === null) {
    return { progress: 0, nextBeat, prevBeat };
  }

  const progress = (currentFrame - prevBeat) / (nextBeat - prevBeat);
  return { progress, nextBeat, prevBeat };
}
