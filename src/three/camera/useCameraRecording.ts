/**
 * Camera Recording Hook
 *
 * Records camera position and rotation while navigating in FPS mode.
 * Outputs keyframes suitable for Remotion playback.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

import type {
  RecordingConfig,
  RecordingState,
  RecordedPath,
  CameraTransform,
  CameraKeyframe,
} from './types';
import { DEFAULT_RECORDING_CONFIG } from './types';
import { simplifyPath } from '../../player/PathInterpolator';

// ============================================================================
// Types
// ============================================================================

export interface UseCameraRecordingOptions {
  /** Recording configuration */
  config?: Partial<RecordingConfig>;
  /** Frames per second for keyframe timing */
  fps?: number;
  /** Called when recording starts */
  onStart?: () => void;
  /** Called when recording stops */
  onStop?: (path: RecordedPath) => void;
  /** Called on each captured keyframe */
  onKeyframe?: (keyframe: CameraKeyframe) => void;
}

export interface UseCameraRecordingReturn {
  /** Current recording state */
  state: RecordingState;
  /** Raw captured keyframes */
  keyframes: CameraKeyframe[];
  /** Start recording */
  startRecording: () => void;
  /** Stop recording */
  stopRecording: () => RecordedPath | null;
  /** Toggle recording */
  toggleRecording: () => void;
  /** Clear all recorded keyframes */
  clearKeyframes: () => void;
  /** Capture a single keyframe manually */
  captureKeyframe: (transform: CameraTransform) => void;
  /** Get the recorded path (with optional simplification) */
  getRecordedPath: (simplify?: boolean) => RecordedPath;
  /** Export keyframes as JSON string */
  exportJSON: () => string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useCameraRecording(
  options: UseCameraRecordingOptions = {}
): UseCameraRecordingReturn {
  const {
    config: configOverrides,
    fps = 60,
    onStart,
    onStop,
    onKeyframe,
  } = options;

  // Merge config with defaults
  const config: RecordingConfig = {
    ...DEFAULT_RECORDING_CONFIG,
    ...configOverrides,
  };

  // State
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    startTime: null,
    keyframeCount: 0,
    duration: 0,
  });

  const [keyframes, setKeyframes] = useState<CameraKeyframe[]>([]);

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransformRef = useRef<CameraTransform | null>(null);
  const frameCounterRef = useRef(0);

  // ========================================================================
  // Recording Control
  // ========================================================================

  const startRecording = useCallback(() => {
    if (state.isRecording) return;

    // Clear previous recording
    setKeyframes([]);
    frameCounterRef.current = 0;

    // Update state
    setState({
      isRecording: true,
      startTime: Date.now(),
      keyframeCount: 0,
      duration: 0,
    });

    // Start capture interval
    intervalRef.current = setInterval(() => {
      // Capture will be triggered by captureKeyframe calls
      frameCounterRef.current += 1;
    }, config.captureInterval);

    onStart?.();
  }, [state.isRecording, config.captureInterval, onStart]);

  const stopRecording = useCallback((): RecordedPath | null => {
    if (!state.isRecording) return null;

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const duration = Date.now() - (state.startTime || 0);

    // Create recorded path
    const path = getRecordedPathInternal(keyframes, duration, config);

    // Update state
    setState({
      isRecording: false,
      startTime: null,
      keyframeCount: keyframes.length,
      duration,
    });

    onStop?.(path);

    return path;
  }, [state.isRecording, state.startTime, keyframes, config, onStop]);

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // ========================================================================
  // Keyframe Capture
  // ========================================================================

  const captureKeyframe = useCallback(
    (transform: CameraTransform) => {
      if (!state.isRecording) return;

      // Check if we've hit the limit
      if (keyframes.length >= config.maxKeyframes) {
        console.warn('useCameraRecording: Max keyframes reached');
        return;
      }

      // Skip if transform hasn't changed significantly
      const last = lastTransformRef.current;
      if (last) {
        const posDiff =
          Math.abs(transform.position[0] - last.position[0]) +
          Math.abs(transform.position[1] - last.position[1]) +
          Math.abs(transform.position[2] - last.position[2]);

        const rotDiff =
          Math.abs(transform.rotation[0] - last.rotation[0]) +
          Math.abs(transform.rotation[1] - last.rotation[1]) +
          Math.abs(transform.rotation[2] - last.rotation[2]) +
          Math.abs(transform.rotation[3] - last.rotation[3]);

        // Skip if no significant change
        if (posDiff < 0.001 && rotDiff < 0.0001) {
          return;
        }
      }

      lastTransformRef.current = transform;

      // Calculate frame number based on elapsed time
      const elapsed = Date.now() - (state.startTime || 0);
      const frame = Math.round((elapsed / 1000) * fps);

      const keyframe: CameraKeyframe = {
        frame,
        position: transform.position,
        rotation: transform.rotation,
        fov: transform.fov,
      };

      setKeyframes((prev) => [...prev, keyframe]);

      setState((prev) => ({
        ...prev,
        keyframeCount: prev.keyframeCount + 1,
        duration: elapsed,
      }));

      onKeyframe?.(keyframe);
    },
    [state.isRecording, state.startTime, keyframes.length, config.maxKeyframes, fps, onKeyframe]
  );

  // ========================================================================
  // Path Export
  // ========================================================================

  const getRecordedPath = useCallback(
    (simplify?: boolean): RecordedPath => {
      return getRecordedPathInternal(
        keyframes,
        state.duration,
        config,
        simplify
      );
    },
    [keyframes, state.duration, config]
  );

  const exportJSON = useCallback((): string => {
    const path = getRecordedPath(true);
    return JSON.stringify(path, null, 2);
  }, [getRecordedPath]);

  // ========================================================================
  // Utility
  // ========================================================================

  const clearKeyframes = useCallback(() => {
    setKeyframes([]);
    lastTransformRef.current = null;
    frameCounterRef.current = 0;
    setState((prev) => ({
      ...prev,
      keyframeCount: 0,
      duration: 0,
    }));
  }, []);

  // ========================================================================
  // Cleanup
  // ========================================================================

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    keyframes,
    startRecording,
    stopRecording,
    toggleRecording,
    clearKeyframes,
    captureKeyframe,
    getRecordedPath,
    exportJSON,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRecordedPathInternal(
  keyframes: CameraKeyframe[],
  duration: number,
  config: RecordingConfig,
  simplify?: boolean
): RecordedPath {
  let finalKeyframes = [...keyframes];

  // Apply simplification if requested
  const shouldSimplify = simplify ?? config.simplifyPath;
  if (shouldSimplify && finalKeyframes.length > 2) {
    finalKeyframes = simplifyPath(finalKeyframes, config.simplifyTolerance);
  }

  return {
    keyframes: finalKeyframes,
    metadata: {
      recordedAt: new Date().toISOString(),
      duration,
      keyframeCount: finalKeyframes.length,
      simplified: shouldSimplify,
    },
  };
}

export default useCameraRecording;
