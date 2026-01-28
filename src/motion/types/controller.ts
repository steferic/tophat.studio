/**
 * Motion Controller Types
 * Configuration and modifier types for the motion system
 */

import type { Point3D } from './path';
import type { LoopMode, ModifierType } from '../../types/scene';

// ============================================================================
// Motion State
// ============================================================================

/**
 * Complete motion state at a given frame
 * This is what the MotionController outputs
 */
export interface MotionState {
  /** World position */
  position: Point3D;
  /** Euler rotation in radians */
  rotation: Point3D;
  /** Scale on each axis */
  scale: Point3D;
  /** Progress along the path (0-1) */
  progress: number;
  /** Tangent direction of the path */
  tangent: Point3D;
}

// ============================================================================
// Modifier System
// ============================================================================

/**
 * Modifier configuration
 */
export interface ModifierConfig {
  type: ModifierType;
  enabled: boolean;
  params: Record<string, number | string | boolean>;
}

/**
 * Modifier interface - transforms motion state
 */
export interface MotionModifier {
  /** Modifier type identifier */
  type: ModifierType;

  /**
   * Apply modifier to current motion state
   * @param state - Current motion state
   * @param frame - Current frame number
   * @param fps - Frames per second
   * @returns Modified motion state
   */
  apply(state: MotionState, frame: number, fps: number): MotionState;

  /**
   * Update modifier parameters
   */
  setParams(params: Record<string, number | string | boolean>): void;

  /**
   * Get current parameters
   */
  getParams(): Record<string, number | string | boolean>;
}

// ============================================================================
// Modifier Configurations
// ============================================================================

export interface RotationModifierParams {
  /** Rotation speed around X axis (rotations per second) */
  speedX: number;
  /** Rotation speed around Y axis */
  speedY: number;
  /** Rotation speed around Z axis */
  speedZ: number;
  /** Whether to add to existing rotation or replace */
  additive: boolean;
}

export interface WobbleModifierParams {
  /** Wobble amplitude on X axis */
  amplitudeX: number;
  /** Wobble amplitude on Y axis */
  amplitudeY: number;
  /** Wobble amplitude on Z axis */
  amplitudeZ: number;
  /** Oscillation frequency (cycles per second) */
  frequency: number;
  /** Phase offset */
  phase: number;
}

export interface ScalePulseModifierParams {
  /** Minimum scale multiplier */
  minScale: number;
  /** Maximum scale multiplier */
  maxScale: number;
  /** Pulse frequency (cycles per second) */
  frequency: number;
  /** Phase offset */
  phase: number;
  /** Whether to affect all axes uniformly */
  uniform: boolean;
}

export interface LookAtModifierParams {
  /** Target position to look at */
  targetX: number;
  targetY: number;
  targetZ: number;
  /** Up vector for orientation */
  upX: number;
  upY: number;
  upZ: number;
  /** Whether to follow path tangent instead */
  followPath: boolean;
}

// ============================================================================
// Motion Controller Configuration
// ============================================================================

/**
 * Full motion controller configuration
 */
export interface MotionControllerConfig {
  /** Path type identifier */
  pathType: string;
  /** Path parameters */
  pathParams: Record<string, number>;
  /** Speed multiplier */
  speed: number;
  /** Progress offset (0-1) */
  progressOffset: number;
  /** Loop behavior */
  loop: LoopMode;
  /** Active modifiers */
  modifiers: ModifierConfig[];
  /** Total duration for this motion (in frames) */
  duration: number;
  /** Start frame */
  startFrame: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate progress based on frame, considering loop mode
 */
export function calculateProgress(
  frame: number,
  startFrame: number,
  duration: number,
  speed: number,
  progressOffset: number,
  loop: LoopMode
): number {
  const localFrame = frame - startFrame;
  if (localFrame < 0) return progressOffset;

  const rawProgress = (localFrame / duration) * speed + progressOffset;

  switch (loop) {
    case 'none':
      return Math.min(1, Math.max(0, rawProgress));

    case 'loop':
      return rawProgress % 1;

    case 'pingpong': {
      const cycle = Math.floor(rawProgress);
      const inCycle = rawProgress % 1;
      return cycle % 2 === 0 ? inCycle : 1 - inCycle;
    }

    default:
      return rawProgress;
  }
}

/**
 * Create default motion state
 */
export function createDefaultMotionState(): MotionState {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    progress: 0,
    tangent: { x: 0, y: 0, z: 1 },
  };
}

/**
 * Merge two motion states (for modifier chaining)
 */
export function mergeMotionState(
  base: MotionState,
  override: Partial<MotionState>
): MotionState {
  return {
    ...base,
    ...override,
  };
}
