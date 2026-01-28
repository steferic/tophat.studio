/**
 * Camera System Types
 *
 * Types for camera paths, keyframes, and recording.
 */

import type { Vector3, Vector4, CameraKeyframe } from '../../types/scene';

// ============================================================================
// Camera State Types
// ============================================================================

export interface CameraTransform {
  /** Position in world space */
  position: Vector3;
  /** Rotation as quaternion (x, y, z, w) */
  rotation: Vector4;
  /** Field of view in degrees */
  fov: number;
}

export interface CameraVelocity {
  /** Linear velocity */
  linear: Vector3;
  /** Angular velocity (euler rates) */
  angular: Vector3;
}

// ============================================================================
// Recording Types
// ============================================================================

export interface RecordingConfig {
  /** Capture interval in milliseconds */
  captureInterval: number;
  /** Whether to simplify the recorded path */
  simplifyPath: boolean;
  /** Simplification tolerance (lower = more detail) */
  simplifyTolerance: number;
  /** Maximum keyframes to store */
  maxKeyframes: number;
}

export interface RecordingState {
  /** Is currently recording */
  isRecording: boolean;
  /** Recording start time */
  startTime: number | null;
  /** Current keyframe count */
  keyframeCount: number;
  /** Total recording duration in ms */
  duration: number;
}

export interface RecordedPath {
  /** Raw recorded keyframes */
  keyframes: CameraKeyframe[];
  /** Recording metadata */
  metadata: {
    recordedAt: string;
    duration: number;
    keyframeCount: number;
    simplified: boolean;
  };
}

// ============================================================================
// FPS Control Types
// ============================================================================

export interface FPSControlConfig {
  /** Base movement speed (units per second) */
  moveSpeed: number;
  /** Sprint multiplier */
  sprintMultiplier: number;
  /** Mouse sensitivity for look */
  lookSensitivity: number;
  /** Invert Y axis */
  invertY: boolean;
  /** Smooth movement (lerp factor) */
  smoothing: number;
  /** Enable vertical movement (space/c) */
  enableVertical: boolean;
  /** Field of view */
  fov: number;
}

export interface FPSControlState {
  /** Pointer lock active */
  isLocked: boolean;
  /** Current velocity */
  velocity: CameraVelocity;
  /** Currently pressed keys */
  keys: FPSKeyState;
}

export interface FPSKeyState {
  forward: boolean;  // W
  backward: boolean; // S
  left: boolean;     // A
  right: boolean;    // D
  up: boolean;       // Space
  down: boolean;     // C or Ctrl
  sprint: boolean;   // Shift
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_FPS_CONFIG: FPSControlConfig = {
  moveSpeed: 10,
  sprintMultiplier: 2.5,
  lookSensitivity: 0.002,
  invertY: false,
  smoothing: 0.15,
  enableVertical: true,
  fov: 60,
};

export const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
  captureInterval: 50, // 20 fps
  simplifyPath: true,
  simplifyTolerance: 0.05,
  maxKeyframes: 10000,
};

export const INITIAL_KEY_STATE: FPSKeyState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  sprint: false,
};

// ============================================================================
// Helper Types
// ============================================================================

export type CameraMode = 'fps' | 'orbit' | 'static' | 'playback';

export interface CameraControllerState {
  mode: CameraMode;
  transform: CameraTransform;
  fpsState?: FPSControlState;
  recordingState?: RecordingState;
}

// Re-export scene types for convenience
export type { CameraKeyframe, CameraPath } from '../../types/scene';
