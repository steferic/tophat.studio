/**
 * Camera System - Public API
 */

// Types
export * from './types';

// Components
export { FPSControls } from './FPSControls';
export type { FPSControlsProps, FPSControlsRef } from './FPSControls';

// Hooks
export { useCameraRecording } from './useCameraRecording';
export type {
  UseCameraRecordingOptions,
  UseCameraRecordingReturn,
} from './useCameraRecording';
